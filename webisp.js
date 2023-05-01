let devices;
let ports;
let selectedPort;
let selectedBaud = 115200;
let baudrateList = [
    9600,
    14400,
    19200,
    38400,
    43000,
    57600,
    76800,
    115200
];

let isPortOpened = false;

let encoder;
let decoder;
let writer;
let reader;

//加载设备json
fetch('devices.json')
    .then(response => response.json())
    .then(data => {
        //console.log(data);
        devices = data
    })
    .catch(error => console.error(error));


window.onload = async function () {

    baudrateList.forEach((baud, index, arr) => {
        let item = document.createElement("li");
        let itemA = document.createElement("a");
        itemA.setAttribute("class", "dropdown-item");
        itemA.onclick = function () {
            selectedPort = index;
            document.getElementById("selectedBaud").innerText = baud;
        }

        itemA.innerText = baud;
        item.appendChild(itemA);
        document.getElementById("baudList").appendChild(item);
    });

    ports = await navigator.serial.getPorts();
    if (ports.length == 0) {
        document.getElementById("selectedDev").innerText = "请进行端口授权";
    } else {
        await getPorts();
    }
}

async function getPorts() {

    //去除无效设备
    ports = ports.filter(element => {
        return element.getInfo().usbProductId;
    });
    if (ports.length === 0) {
        console.log("--- getPort() return nothing ---");
        return;
    }
    document.getElementById("devList").innerHTML = "";
    ports.forEach((port, index, arr) => {
        //输出端口信息
        const info = port.getInfo();
        console.log((index + 1) + ": {vendorId:" + info.usbVendorId + ", productId: " + info.usbProductId + "}");
        //找到制造商
        const vendor = devices.filter(dev => {
            return dev.vendor == port.getInfo().usbVendorId.toString(16);
        });
        //找到设备
        vendor.forEach(ven => {
            const product = ven.devices.filter(dev => {
                // console.log(dev.devid);
                return dev.devid == port.getInfo().usbProductId.toString(16);
            });
            product.forEach(pord => {
                port.name = pord.devname;
            });
        });
        let item = document.createElement("li");
        let itemA = document.createElement("a");
        itemA.setAttribute("class", "dropdown-item");
        itemA.onclick = function () {
            selectedPort = index;
            document.getElementById("selectedDev").innerText = port.name;
        }
        // itemA.setAttribute("onclick","function(){selectedPort = "+index+"}");
        // itemA.setAttribute("href","#");
        itemA.innerText = port.name;
        item.appendChild(itemA);
        document.getElementById("devList").appendChild(item);
    });

}

async function requestPorts() {
    console.log("--- requesting ports ---");
    await navigator.serial.requestPort();
    ports = await navigator.serial.getPorts();
    await getPorts();
}

async function openPort() {
    console.log("--- open port ---");
    // console.log("opening at baudrate: " + document.getElementById("baudrate").value);
    await ports[selectedPort].open({ baudRate: selectedBaud });
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    writer = ports[selectedPort].writable.getWriter();
    reader = ports[selectedPort].readable.getReader();
    isPortOpened = true;
}

async function closePort() {
    console.log("---close port---");
    writer.releaseLock();
    reader.releaseLock();
    port.close();
    isPortOpened = false;
}

async function sendInfo() {

    if (!isPortOpened) {
        console.log("--- port have not opended ---");
        const toastElement = document.getElementById("toastMsg");
        toastElement.childNodes[1].innerText = "发送成功";
        var toastInstance = new bootstrap.Toast(toastElement);
        toastInstance.show();
        return;
    }
    console.log("send: " + document.getElementById("output").value);
    await writer.write(encoder.encode(document.getElementById("output").value));
}

async function receiveInfo() {
    if (!isPortOpened) {
        console.log("--- port have not opended ---");
        return;
    }
    const { value, done } = await reader.read();
    if (done) {
        console.log("--- read fail ---");
    } else {
        document.getElementById("input").value = decoder.decode(value);
        console.log("receive: " + document.getElementById("input").value);
    }
}



