import { useState } from "react";
import { Check, Paperclip, Plus, X } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { PAYMENT_STATUS, fmtDate, fmtMoney } from "../../format";
import { Button, Empty, ErrorNote, Field, Modal, Pill, QueryState } from "../../ui";

function ItemForm({ event, onDone }) {
  const { create } = useCrud("payment-items");
  const [form, setForm] = useState({ title: "", amount: "", currency: "KGS" });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({ ...form, event: event.id }, { onSuccess: onDone });
      }}
    >
      <Field label="За что платят">
        <input value={form.title} onChange={set("title")} required placeholder="Взнос за смену" />
      </Field>
      <div className="row-2">
        <Field label="Сумма">
          <input type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required />
        </Field>
        <Field label="Валюта">
          <select value={form.currency} onChange={set("currency")}>
            <option value="KGS">сом (KGS)</option>
            <option value="USD">USD</option>
            <option value="KZT">KZT</option>
            <option value="RUB">RUB</option>
          </select>
        </Field>
      </div>
      <ErrorNote error={create.error} />
      <div className="actions">
        <Button type="submit" disabled={create.isPending}>
          Добавить статью
        </Button>
      </div>
    </form>
  );
}

export default function PaymentsTab({ event }) {
  const items = useList("payment-items", { event: event.id });
  const [status, setStatus] = useState("PENDING");
  const payments = useList("payments", { item__event: event.id, status });
  const { update } = useCrud("payments");
  const itemsCrud = useCrud("payment-items");
  const [addingItem, setAddingItem] = useState(false);

  return (
    <section className="payments">
      <div className="pay-items">
        <div className="section-head">
          <h2>Что оплачивают гости</h2>
          <Button variant="ghost" size="sm" onClick={() => setAddingItem(true)}>
            <Plus size={14} /> Статья
          </Button>
        </div>
        <QueryState query={items}>
          {(list) =>
            list.length === 0 ? (
              <p className="muted">Статей оплаты нет — гостям нечего оплачивать.</p>
            ) : (
              <ul className="pay-item-list">
                {list.map((it) => (
                  <li key={it.id}>
                    <span>{it.title}</span>
                    <span className="amount">{fmtMoney(it.amount, it.currency)}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Удалить ${it.title}`}
                      onClick={() => itemsCrud.remove.mutate(it.id)}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
        <ErrorNote error={itemsCrud.remove.error} />
      </div>

      <div className="section-head">
        <h2>Платежи гостей</h2>
        <div className="segmented segmented-sm">
          {[["PENDING", "На проверке"], ["APPROVED", "Подтверждены"], ["REJECTED", "Отклонены"], ["", "Все"]].map(
            ([value, label]) => (
              <button key={value} type="button" aria-selected={status === value} onClick={() => setStatus(value)}>
                {label}
              </button>
            )
          )}
        </div>
      </div>
      <ErrorNote error={update.error} />

      <QueryState query={payments}>
        {(list) =>
          list.length === 0 ? (
            <Empty title={status === "PENDING" ? "Нечего проверять" : "Платежей нет"}>
              Гость отправляет чек из своего приложения, и он появляется здесь.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Гость</th>
                    <th>За что</th>
                    <th>Сумма</th>
                    <th>Дата</th>
                    <th>Чек</th>
                    <th>Статус</th>
                    <th aria-label="Решение" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td className="strong">{p.participant_name}</td>
                      <td>{p.item_title}</td>
                      <td className="nowrap amount">{fmtMoney(p.amount, p.currency)}</td>
                      <td className="nowrap">{fmtDate(p.created_at)}</td>
                      <td>
                        {p.receipt ? (
                          <a className="link" href={p.receipt} target="_blank" rel="noreferrer">
                            <Paperclip size={14} /> Открыть
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Pill status={p.status}>{PAYMENT_STATUS[p.status]}</Pill>
                      </td>
                      <td className="row-actions">
                        {p.status !== "APPROVED" ? (
                          <Button size="sm" onClick={() => update.mutate({ id: p.id, status: "APPROVED" })}>
                            <Check size={14} /> Принять
                          </Button>
                        ) : null}
                        {p.status !== "REJECTED" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const reason = window.prompt("Причина отклонения (гость её увидит):", "");
                              if (reason !== null) update.mutate({ id: p.id, status: "REJECTED", admin_comment: reason });
                            }}
                          >
                            Отклонить
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>

      {addingItem ? (
        <Modal title="Новая статья оплаты" onClose={() => setAddingItem(false)}>
          <ItemForm event={event} onDone={() => setAddingItem(false)} />
        </Modal>
      ) : null}
    </section>
  );
}
