import { createNavigationContainerRef } from '@react-navigation/native';

// Navigation Reference တစ်ခု ဖန်တီးခြင်း
export const navigationRef = createNavigationContainerRef();

// Screen အပြင်ဘက်ကနေ လှမ်းပြီး Navigation လုပ်ချင်တဲ့အခါ သုံးမယ့် Function တွေ
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}