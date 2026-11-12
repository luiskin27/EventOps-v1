from django.core.files.storage import storages


def public_storage():
    """Публичное хранилище (фото на стене поздравлений). В разработке — та же папка media/."""
    return storages["public"]
