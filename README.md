## WebISP | web端的串口下载器

### 概况

| 功能     | 状态     |
| -------- | -------- |
| 串口开关 | 勉强可用 |
| 串口收发 | 勉强可用 |
| 串口下载 | 未实现   |
| 使用体验 | 乐色     |

[点击体验](https://orange-8.github.io/WebISP/) (感觉webisp不错或者可能有价值请点点star)


### 参考资料

1. Web API： [Serial](https://developer.mozilla.org/en-US/docs/Web/API/Serial)

2. UI：[Bootstrap](https://v5.bootcss.com/docs/)

3. 串口下载协议：

| 型号  | 协议文档                                                                                                                                                                                                                       | 实现 | 验证 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---- |
| STM32 | [AN3155: STM32™ 自举程序中使用的 USART 协议](https://www.st.com/content/ccc/resource/technical/document/application_note/51/5f/03/1e/bd/9b/45/be/CD00264342.pdf/files/CD00264342.pdf/jcr:content/translations/zh.CD00264342.pdf) |      |      |
| ESP32 | [ESP8266 SDK 应用笔记固件下载协议](https://www.espressif.com.cn/sites/default/files/documentation/esp8266-sdk_application_note_firmware_download_protocol_cn.pdf)（只找到这个）                                                   |      |      |


#### 帮帮孩子

目前情况是查了一下UI框架大都要react、vue，然后想实现的界面挺简单的不想再搞nodejs啥啥的，用js和bootstrap糊了这些出来。想知道有没有什么从方法论到实践的JS和UI框架的教程。
