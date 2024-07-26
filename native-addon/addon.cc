#include <windows.h>
#include <iostream>
#include <cctype>
#include <node_api.h>

HHOOK keyboardHook;
int f11Counter = 0;
int f12Counter = 0;
char f11OutputKey;
char f12OutputKey;

LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode >= 0 && wParam == WM_KEYDOWN) {
        KBDLLHOOKSTRUCT* kbStruct = (KBDLLHOOKSTRUCT*)lParam;
        if (kbStruct->vkCode == VK_F11) {
            f11Counter++;
            if (f11Counter == 1) {
                f11Counter = 0;
                INPUT input;
                input.type = INPUT_KEYBOARD;
                input.ki.wVk = VkKeyScan(f11OutputKey) & 0xFF;
                input.ki.wScan = 0;
                input.ki.dwFlags = 0; // 0 for key press
                input.ki.time = 0;
                input.ki.dwExtraInfo = 0;
                SendInput(1, &input, sizeof(INPUT));
                input.ki.dwFlags = KEYEVENTF_KEYUP; // for key release
                SendInput(1, &input, sizeof(INPUT));
                return 1;
            }
        } else if (kbStruct->vkCode == VK_F12) {
            f12Counter++;
            if (f12Counter == 1) {
                f12Counter = 0;
                INPUT input;
                input.type = INPUT_KEYBOARD;
                input.ki.wVk = VkKeyScan(f12OutputKey) & 0xFF;
                input.ki.wScan = 0;
                input.ki.dwFlags = 0; // 0 for key press
                input.ki.time = 0;
                input.ki.dwExtraInfo = 0;
                SendInput(1, &input, sizeof(INPUT));
                input.ki.dwFlags = KEYEVENTF_KEYUP; // for key release
                SendInput(1, &input, sizeof(INPUT));
                return 1;
            }
        }
    }
    return CallNextHookEx(keyboardHook, nCode, wParam, lParam);
}

void SetKeyboardHook() {
    if (!(keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, NULL, 0))) {
        std::cerr << "Failed to install keyboard hook!" << std::endl;
    }
}

void UnhookKeyboard() {
    UnhookWindowsHookEx(keyboardHook);
}

napi_value StartHook(napi_env env, napi_callback_info info) {
    SetKeyboardHook();
    return nullptr;
}

napi_value StopHook(napi_env env, napi_callback_info info) {
    UnhookKeyboard();
    return nullptr;
}

napi_value SetF11Key(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    size_t str_len;
    char buffer[2];
    napi_get_value_string_utf8(env, argv[0], buffer, 2, &str_len);
    f11OutputKey = toupper(buffer[0]);
    return nullptr;
}

napi_value SetF12Key(napi_env env, napi_callback_info info) {
    size_t argc = 1;
    napi_value argv[1];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    size_t str_len;
    char buffer[2];
    napi_get_value_string_utf8(env, argv[0], buffer, 2, &str_len);
    f12OutputKey = toupper(buffer[0]);
    return nullptr;
}

napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        { "startHook", 0, StartHook, 0, 0, 0, napi_default, 0 },
        { "stopHook", 0, StopHook, 0, 0, 0, napi_default, 0 },
        { "setF11Key", 0, SetF11Key, 0, 0, 0, napi_default, 0 },
        { "setF12Key", 0, SetF12Key, 0, 0, 0, napi_default, 0 }
    };
    napi_define_properties(env, exports, 4, desc);
    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
