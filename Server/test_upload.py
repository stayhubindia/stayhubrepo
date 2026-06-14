import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.users.models import User
from apps.communication.models import Conversation
from apps.communication.services import CommunicationService
from django.core.files.uploadedfile import SimpleUploadedFile

user = User.objects.first()
conv = Conversation.objects.filter(tenant=user).first() or Conversation.objects.first()

if conv and user:
    try:
        audio = SimpleUploadedFile("test.m4a", b"file_content", content_type="audio/mp4")
        msg = CommunicationService.send_text_message(
            conversation=conv,
            sender=user,
            content="",
            image=None,
            audio=audio
        )
        print("Success:", msg.id)
    except Exception as e:
        import traceback
        traceback.print_exc()
else:
    print("No user or conversation found.")
