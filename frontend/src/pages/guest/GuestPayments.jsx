import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api/client";
import { useList } from "../../api/hooks";
import { PAYMENT_STATUS, fmtDate, fmtMoney } from "../../format";
import { Button, Empty, ErrorNote, Pill, QueryState } from "../../ui";

function ReceiptUpload({ item }) {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const send = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("item", item.id);
      data.append("receipt", file);
      return api("payments/", { method: "POST", body: data });
    },
    onSuccess: () => {
      setFile(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return (
    <div className="upload">
      <label className="file-pick">
        <Upload size={16} />
        <span>{file ? file.name : "Выбрать фото чека"}</span>
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {file ? (
        <Button size="sm" disabled={send.isPending} onClick={() => send.mutate()}>
          {send.isPending ? "Отправляем…" : "Отправить чек"}
        </Button>
      ) : null}
      <ErrorNote error={send.error} />
    </div>
  );
}

export default function GuestPayments() {
  const { user } = useAuth();
  const items = useList("payment-items", { event: user.participant.event });
  const payments = useList("payments");

  return (
    <QueryState query={items}>
      {(list) => {
        if (list.length === 0) return <Empty title="Оплачивать ничего не нужно" />;
        const mine = payments.data || [];
        const total = list.reduce((sum, it) => sum + Number(it.amount), 0);
        const paid = list
          .filter((it) => mine.some((p) => p.item === it.id && p.status === "APPROVED"))
          .reduce((sum, it) => sum + Number(it.amount), 0);

        return (
          <>
            <section className="balance">
              <p>Осталось оплатить</p>
              <p className="balance-sum">{fmtMoney(total - paid, list[0].currency)}</p>
              <p className="muted">из {fmtMoney(total, list[0].currency)}</p>
            </section>

            <ul className="pay-cards">
              {list.map((it) => {
                const history = mine.filter((p) => p.item === it.id);
                const latest = history[0]; // backend сортирует по дате, новые первыми
                const approved = history.some((p) => p.status === "APPROVED");
                return (
                  <li key={it.id} className="pay-card">
                    <div className="pay-card-head">
                      <span className="strong">{it.title}</span>
                      <span className="amount">{fmtMoney(it.amount, it.currency)}</span>
                    </div>
                    {latest ? (
                      <p className="pay-state">
                        <Pill status={approved ? "APPROVED" : latest.status}>
                          {PAYMENT_STATUS[approved ? "APPROVED" : latest.status]}
                        </Pill>
                        <span className="muted">чек от {fmtDate(latest.created_at)}</span>
                      </p>
                    ) : null}
                    {latest?.status === "REJECTED" && latest.admin_comment ? (
                      <p className="note note-error">{latest.admin_comment}</p>
                    ) : null}
                    {!approved && latest?.status !== "PENDING" ? <ReceiptUpload item={it} /> : null}
                  </li>
                );
              })}
            </ul>
          </>
        );
      }}
    </QueryState>
  );
}
