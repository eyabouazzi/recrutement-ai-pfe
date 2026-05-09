let messageApi = null;
let notificationApi = null;

export function bindAntdApp(apis = {}) {
    if (apis.message) {
        messageApi = apis.message;
    }
    if (apis.notification) {
        notificationApi = apis.notification;
    }
}

export function getMessageApi() {
    return messageApi;
}

export function getNotificationApi() {
    return notificationApi;
}
