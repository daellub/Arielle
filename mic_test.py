import comtypes
from pycaw.pycaw import AudioUtilities, IMMDeviceEnumerator, EDataFlow, DEVICE_STATE
from pycaw.constants import CLSID_MMDeviceEnumerator

deviceEnumerator = comtypes.CoCreateInstance(
    CLSID_MMDeviceEnumerator,
    IMMDeviceEnumerator,
    comtypes.CLSCTX_INPROC_SERVER)

collection = deviceEnumerator.EnumAudioEndpoints(EDataFlow.eCapture.value, DEVICE_STATE.ACTIVE.value)
count = collection.GetCount()

print("🎙 사용 가능한 마이크 목록:")
for i in range(count):
    dev = collection.Item(i)
    device = AudioUtilities.CreateDevice(dev)
    print(f"📌 {device.FriendlyName}")
    print(f"🔗 {device.id}\n")
