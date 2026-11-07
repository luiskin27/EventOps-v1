"""Демо-данные для локальной разработки.

    docker compose exec backend python manage.py seed_demo

Создаёт сотрудника staff1 / staff12345, событие «Летний лагерь», роли,
участников (гость входит по телефону + коду), расписание, статьи оплаты, задачи, бейдж.
Повторный запуск безопасен — ничего не дублируется.
"""

from datetime import date, datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.badges.models import Badge, BadgeTemplate
from apps.events.models import Event
from apps.participants.models import Participant, Role
from apps.payments.models import PaymentItem
from apps.schedule.models import ScheduleItem
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

        if not event.tasks.exists():
            Task.objects.create(event=event, title="Закупить продукты на 1-й день", assignee=staff,
                                due_date=start - timedelta(days=1))
            Task.objects.create(event=event, title="Распечатать бейджи", status=Task.Status.IN_PROGRESS,
                                due_date=start - timedelta(days=2))
            Task.objects.create(event=event, title="Договориться с автобусом", status=Task.Status.DONE)

        self.stdout.write(self.style.SUCCESS("Готово."))
        self.stdout.write("Сотрудник:  staff1 / staff12345")
        self.stdout.write("Гость:      телефон +996 700 111 222, код ALA001")
