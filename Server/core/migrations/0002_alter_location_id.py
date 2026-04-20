from django.db import migrations, models
import time
import secrets
import uuid


def uuid_default():
    def gen():
        ts_ms = int(time.time() * 1000)
        return uuid.UUID(int=((ts_ms << 80) | secrets.randbits(80)))

    return gen


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="location",
            name="id",
            field=models.UUIDField(default=uuid_default(), editable=False, primary_key=True, serialize=False),
        ),
    ]
