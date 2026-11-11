"""Демо-данные для локальной разработки.

    docker compose exec backend python manage.py seed_demo

Создаёт сотрудника staff1 / staff12345 и два мероприятия:
- «Свадьба Айжан и Тимура» — главный пример: команда (тамада, диджей, повар…),
  расписание для гостей / ведущего и диджея / персонала, задачи с ответственными;
- «Летний лагерь «Ала-Арча»» — пример с оплатой взносов и проверкой документов.
Гость входит по телефону + коду.
Повторный запуск безопасен — ничего не дублируется.
"""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.badges.models import Badge, BadgeTemplate
from apps.documents.models import DocumentType
from apps.events.models import Event, TeamMember
from apps.participants.models import Participant, Role
from apps.payments.models import PaymentItem
from apps.schedule.models import Audience, ScheduleItem, ScheduleLink
from apps.tasks.models import Task

User = get_user_model()


class Command(BaseCommand):
    help = "Создать демо-данные (сотрудник, событие, гости, расписание)"

    def handle(self, *args, **options):
        staff, _ = User.objects.get_or_create(
            username="staff1", defaults={"is_staff": True, "first_name": "Айгерим"}
        )
        staff.is_staff = True
        staff.set_password("staff12345")
        staff.save()

        start = date.today() + timedelta(days=7)
        event, _ = Event.objects.get_or_create(
            title="Летний лагерь «Ала-Арча»",
            defaults={
                "event_type": Event.EventType.CAMP,
                "description": "Смена для подростков 12–16 лет: походы, мастер-классы, костёр.",
                "location": "Ала-Арча, Чуйская область",
                "start_date": start,
                "end_date": start + timedelta(days=6),
            },
        )

        roles = {
            name: Role.objects.get_or_create(event=event, name=name)[0]
            for name in ("Участник", "Вожатый", "Организатор")
        }

        people = [
            ("Асанов Бекжан", "+996 700 111 222", "ALA001", "Участник"),
            ("Иванова Мария", "+996 555 333 444", "ALA002", "Участник"),
            ("Токтогулов Эмир", "+996 777 555 666", "ALA003", "Вожатый"),
        ]
        participants = []
        for full_name, phone, code, role in people:
            p, _ = Participant.objects.get_or_create(
                event=event,
                full_name=full_name,
                defaults={"phone": phone, "guest_code": code, "role": roles[role]},
            )
            participants.append(p)

        BadgeTemplate.objects.get_or_create(event=event, defaults={"background_color": "#FFF7E8"})
        Badge.objects.get_or_create(participant=participants[0])

        if not event.schedule_items.exists():
            tz = timezone.get_current_timezone()
            plan = [
                (0, time(10, 0), time(11, 0), "Заезд и регистрация", "Главный корпус"),
                (0, time(12, 0), time(13, 0), "Обед", "Столовая"),
                (0, time(15, 0), time(17, 0), "Знакомство по отрядам", "Поляна"),
                (1, time(8, 0), time(13, 0), "Поход к водопаду", "Сбор у ворот"),
                (1, time(19, 0), time(21, 0), "Вечерний костёр", "Кострище"),
            ]
            for day, t1, t2, title, loc in plan:
                d = start + timedelta(days=day)
                ScheduleItem.objects.create(
                    event=event,
                    title=title,
                    location=loc,
                    starts_at=datetime.combine(d, t1, tzinfo=tz),
                    ends_at=datetime.combine(d, t2, tzinfo=tz),
                )

        for title, amount in (("Взнос за смену", 18000), ("Трансфер", 1500)):
            PaymentItem.objects.get_or_create(event=event, title=title, defaults={"amount": amount})

        for order, (title, hint, required) in enumerate((
            ("Удостоверение личности", "Фото лицевой стороны ID-карты или паспорта, целиком и без бликов", True),
            ("Согласие родителей", "Подписанный бланк — скачайте в документах мероприятия", True),
            ("Медицинская справка", "Если есть аллергии или хронические заболевания", False),
        )):
            DocumentType.objects.get_or_create(
                event=event, title=title, defaults={"description": hint, "is_required": required, "order": order}
            )

        if not event.tasks.exists():
            Task.objects.create(event=event, title="Закупить продукты на 1-й день", assignee=staff,
                                due_date=start - timedelta(days=1))
            Task.objects.create(event=event, title="Распечатать бейджи", status=Task.Status.IN_PROGRESS,
                                due_date=start - timedelta(days=2))
            Task.objects.create(event=event, title="Договориться с автобусом", status=Task.Status.DONE)

        self.seed_wedding(staff)

        self.stdout.write(self.style.SUCCESS("Готово."))
        self.stdout.write("Организатор:     staff1 / staff12345")
        self.stdout.write("Гость свадьбы:   телефон +996 700 222 333, код AIT001")
        self.stdout.write("Участник лагеря: телефон +996 700 111 222, код ALA001")

    def seed_wedding(self, staff):
        day = date.today() + timedelta(days=11)
        event, _ = Event.objects.get_or_create(
            title="Свадьба Айжан и Тимура",
            defaults={
                "event_type": Event.EventType.WEDDING,
                "description": "Ждём вас разделить с нами самый важный день! Дресс-код: пастельные тона.",
                "location": "Бишкек, ресторан «Ала-Тоо Холл»",
                "start_date": day,
                "end_date": day,
            },
        )
        roles = {n: Role.objects.get_or_create(event=event, name=n)[0] for n in ("Гость", "Родственник", "Друг невесты", "Друг жениха")}
        guests = [
            ("Садыкова Нургуль", "+996 700 222 333", "AIT001", "Друг невесты"),
            ("Осмонов Бекзат", "+996 555 444 555", "AIT002", "Друг жениха"),
            ("Иманалиева Гульнара", "+996 777 666 777", "AIT003", "Родственник"),
            ("Ким Ольга", "+996 500 888 999", "AIT004", "Гость"),
        ]
        for full_name, phone, code, role in guests:
            p, _ = Participant.objects.get_or_create(
                event=event, full_name=full_name, defaults={"phone": phone, "guest_code": code, "role": roles[role]}
            )
            Badge.objects.get_or_create(participant=p)
        BadgeTemplate.objects.get_or_create(event=event, defaults={"background_color": "#FFF8F3"})

        team = {}
        for name, position, phone in (
            ("Нурбек Асанов", "Тамада", "+996 555 100 200"),
            ("Айбек Токтогулов", "Диджей", "+996 700 300 400"),
            ("Динара Ким", "Фотограф", "+996 777 500 600"),
            ("Эрлан Жумабаев", "Шеф-повар", "+996 550 700 800"),
            ("Гульмира Садыкова", "Координатор", "+996 705 900 100"),
            ("Асель Мамбетова", "Флорист", "+996 555 222 111"),
        ):
            team[position], _ = TeamMember.objects.get_or_create(
                event=event, full_name=name, defaults={"position": position, "phone": phone}
            )

        if not event.schedule_items.exists():
            tz = timezone.get_current_timezone()
            G, H, S, T = Audience.GUESTS, Audience.HOSTS, Audience.STAFF, Audience.TEAM
            plan = [
                (time(12, 0), time(15, 0), "Монтаж декора и цветов", "Банкетный зал", T),
                (time(15, 0), time(16, 0), "Саундчек и проверка экрана", "Сцена", H),
                (time(16, 0), time(16, 30), "Сервировка столов", "Банкетный зал", S),
                (time(17, 0), time(18, 0), "Сбор гостей, фотозона, фуршет", "Фойе", G),
                (time(17, 30), time(18, 0), "Подача холодных закусок", "Кухня → столы", S),
                (time(18, 0), time(18, 20), "Выход жениха и невесты", "Главный зал", G),
                (time(18, 20), time(18, 40), "Приветствие ведущего, первые тосты родителей", "Сцена", H),
                (time(19, 0), time(19, 20), "Подача горячего (первое)", "Кухня → столы", S),
                (time(19, 30), time(20, 0), "Конкурсы и игры с гостями", "Танцпол", H),
                (time(20, 0), time(20, 15), "Первый танец молодых", "Танцпол", G),
                (time(20, 15), time(20, 45), "Антракт, открытый танцпол", "Танцпол", G),
                (time(20, 45), time(21, 0), "Подача второго горячего", "Кухня → столы", S),
                (time(21, 30), time(21, 50), "Тосты друзей и родственников", "Сцена", H),
                (time(22, 0), time(22, 20), "Вынос и разрезание торта", "Главный зал", G),
                (time(22, 10), time(22, 30), "Подача десерта и чая", "Кухня → столы", S),
                (time(23, 0), None, "Завершение вечера, проводы гостей", "Фойе", G),
            ]
            for t1, t2, title, loc, aud in plan:
                ScheduleItem.objects.create(
                    event=event, title=title, location=loc, audience=aud,
                    starts_at=datetime.combine(day, t1, tzinfo=tz),
                    ends_at=datetime.combine(day, t2, tzinfo=tz) if t2 else None,
                )
        for aud in (Audience.HOSTS, Audience.STAFF):
            ScheduleLink.objects.get_or_create(event=event, audience=aud)

        if not event.tasks.exists():
            T_ = Task.Status
            for title, who, days_before, t, status in (
                ("Согласовать плейлист для первого танца", "Диджей", 7, time(18, 0), T_.IN_PROGRESS),
                ("Утвердить сценарий конкурсов", "Тамада", 5, time(12, 0), T_.TODO),
                ("Финальное меню и количество порций", "Шеф-повар", 4, time(15, 0), T_.TODO),
                ("Букет невесты и бутоньерка", "Флорист", 1, time(10, 0), T_.TODO),
                ("Рассадка гостей по столам", "Координатор", 3, time(19, 0), T_.TODO),
                ("Подтвердить время фотосессии", "Фотограф", 14, time(14, 0), T_.DONE),
            ):
                Task.objects.create(
                    event=event, title=title, responsible=team[who], status=status,
                    due_date=day - timedelta(days=days_before), due_time=t,
                )
