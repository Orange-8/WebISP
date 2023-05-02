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

        if (index == 0) {
            selectedPort = index;
            document.getElementById("selectedDev").innerText = port.name;
            openPort();
        }
    });

}

async function requestPorts() {
    console.log("--- requesting ports ---");
    await navigator.serial.requestPort();
    ports = await navigator.serial.getPorts();
    await getPorts();
}

async function openPort() {
    if (isPortOpened) {
        console.log("--- port has already opended ---");
        const toastElement = document.getElementById("toastMsg");
        toastElement.childNodes[1].innerText = "端口已打开";
        let toastInstance = new bootstrap.Toast(toastElement);
        toastInstance.show();
        return;
    }
    console.log("--- open port ---");
    // console.log("opening at baudrate: " + document.getElementById("baudrate").value);
    await ports[selectedPort].open({ baudRate: selectedBaud });
    encoder = new TextEncoder();
    decoder = new TextDecoder("gb18030");
    writer = ports[selectedPort].writable.getWriter();
    reader = ports[selectedPort].readable.getReader();
    isPortOpened = true;
}

async function closePort() {
    console.log("--- close port ---");
    writer.releaseLock();
    reader.releaseLock();
    ports[selectedPort].close();
    isPortOpened = false;
}

async function sendInfo() {

    if (!isPortOpened) {
        console.log("--- port have not opended ---");
        const toastElement = document.getElementById("toastMsg");
        toastElement.childNodes[1].innerText = "端口未打开";
        let toastInstance = new bootstrap.Toast(toastElement);
        toastInstance.show();
        return;
    }
    await writer.write(encoder.encode(document.getElementById("output").value));
    console.log("send: " + document.getElementById("output").value);
}

async function receiveInfo() {
    if (!isPortOpened) {
        console.log("--- port have not opended ---");
        const toastElement = document.getElementById("toastMsg");
        toastElement.childNodes[1].innerText = "端口未打开";
        let toastInstance = new bootstrap.Toast(toastElement);
        toastInstance.show();
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

function hexText2buffer(str) {
    let len = str.length;
    if (len % 2 == 1) {
        return;
    }
    const buffer = new ArrayBuffer(len / 2);
    for (let i = 0; i < len; i += 2) {
        buffer[i / 2] = parseInt(str.substr(i, 2), 16);
    }
    return buffer;
}


var test;
async function download() {
    console.log("--- testing ---");
    const toastElement = document.getElementById("toastMsg");
    toastElement.childNodes[1].innerText = "--- 测试 ---";
    let toastInstance = new bootstrap.Toast(toastElement);
    toastInstance.show();

    hexFileList = document.getElementById('inputFile').files;
    if (hexFileList.length == 0) {
        console.log("--- no file selected ---");
        return;
    }
    console.log(hexFileList[0]);
    let hexFile = new FileReader();
    hexFile.onload = function (event) {
        let content = event.target.result;
        let lines = content.split('\r\n');
        lines.forEach(function (line) {
            console.log(line);
            let buffer;
            if (line[0]==':') {
                buffer = hexText2buffer(line.slice(1));
            }else{
                console.log("--- unreconised file ---");
                //return;
            }
            
            if (buffer[3]==0) {//数据
                
            }else if (buffer[3]==1) {//EOF
                
            }else if (buffer[3]==4) {//拓展线性地址
                console.log("extend address");
            }

            
        });
        test = lines[0];
        console.log(test);
    };
    hexFile.readAsText(hexFileList[0]);

}



