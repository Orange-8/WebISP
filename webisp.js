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

let extendAddr = new Uint8Array([0x08, 0x00]);


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

async function openPort(isDownload = 0) {
    if (isPortOpened) {
        console.log("--- port has already opended ---");
        showToastInfo("端口已打开");
        return;
    }
    
    if (isDownload) {
        await ports[selectedPort].open({ baudRate: 115200, parity: "even" });
    }else{
        await ports[selectedPort].open({ baudRate: selectedBaud});
    }
    encoder = new TextEncoder();
    decoder = new TextDecoder("gb18030");
    writer = ports[selectedPort].writable.getWriter();
    reader = ports[selectedPort].readable.getReader();
    isPortOpened = true;
    console.log("--- open port ---");
    showToastInfo("端口已打开");
}

async function closePort() {
    await writer.releaseLock();
    await reader.releaseLock();
    await ports[selectedPort].close();
    isPortOpened = false;
    console.log("--- close port ---");
    showToastInfo("端口已关闭");
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

async function sendHexInfo() {


    sendHexStr(document.getElementById("output").value);
    // let buffer = hexStr2Uint8Array(document.getElementById("output").value);
    // console.log(buffer);
    // await writer.write(buffer);
    // console.log("send: " + document.getElementById("output").value);
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
        //console.log(value);
        document.getElementById("input").value = uint8Array2HexStr(value);
        // document.getElementById("input").value = decoder.decode(value);
        console.log("receive: " + document.getElementById("input").value);
    }
}

function showToastInfo(info) {
    const toastElement = document.getElementById("toastMsg");
    toastElement.childNodes[1].innerText = info;
    let toastInstance = new bootstrap.Toast(toastElement);
    toastInstance.show();
}

function hexStr2Uint8Array(str) {
    let len = str.length;
    if (len % 2 == 1) {
        return;
    }
    const buffer = new Uint8Array(len / 2);
    for (let i = 0; i < len; i += 2) {
        buffer[i / 2] = parseInt(str.substr(i, 2), 16);
    }
    return buffer;
}

function uint8Array2HexStr(array) {
    return Array.prototype.map.call(array, function (byte) {
        return ('0' + byte.toString(16)).slice(-2);
    }).join('');
}


var test;
async function download() {
    console.log("--- downloading ---");
    showToastInfo("下载中");

    hexFileList = document.getElementById('inputFile').files;
    if (hexFileList.length == 0) {
        console.log("--- no file selected ---");
        showToastInfo("请选择文件");
        return;
    }
    if (isPortOpened) {
        await closePort();
    }
    await openPort(1);
    console.log(hexFileList[0]);
    let hexFile = new FileReader();
    hexFile.onload = async function (event) {
        let content = event.target.result;
        let lines = content.split('\r\n');

        await devGetAsync();

        await devEraseAll();

        let allLines = lines.length;
        let doneLines = 0;
        for (const line of lines) {
            let buffer;
            if (line[0] == ':') {
                //console.log(line);
                buffer = hexStr2Uint8Array(line.slice(1));
            } else {
                console.log("--- unreconised line "+doneLines+" ---");
                continue;
            }

            doneLines++;
            if ((doneLines%10)===0) {
                console.log(Math.ceil(doneLines/allLines*100)+"%")
            }

            if (buffer[3] == 0) {//数据
                await devWriteMemary(buffer);
            } else if (buffer[3] == 1) {//EOF
                break;
            } else if (buffer[3] == 4) {//拓展线性地址
                await devSetAddrMSB(buffer);
            }
        }
        console.log("--- reset to main ---");
        await devResetToMain();
        // lines.forEach(function (line) {
        //     console.log(line);
        //     let buffer;
        // if (line[0] == ':') {
        //     buffer = hexStr2Uint8Array(line.slice(1));
        // } else {
        //     console.log("--- unreconised file ---");
        //     return;
        // }

        // if (buffer[3] == 0) {//数据
        //     await writeBlock(buffer);
        // } else if (buffer[3] == 1) {//EOF

        // } else if (buffer[3] == 4) {//拓展线性地址
        //     console.log("extend address");
        // }


        // });
    };
    hexFile.readAsText(hexFileList[0]);

}

function hexStrChecksum(hexString) {
    let sum = 0;
    for (let i = 0; i < hexString.length; i += 2) {
        const byte = parseInt(hexString.substr(i, 2), 16);
        sum += byte;
    }
    if ((sum & 0xff) === 0) {
        return true;
    } else {
        return false;
    }

}

function calculateXOR(hexString) {
    let xor = 0;
    for (let i = 0; i < hexString.length; i += 2) {
        const byte = parseInt(hexString.substr(i, 2), 16);
        xor ^= byte;
    }
    const checksum = xor.toString(16);
    return checksum.length === 1 ? '0' + checksum : checksum;
}
function fillXOR(uint8array) {
    let xor = 0;
    for (let i = 0; i < uint8array.length - 1; i++) {
        xor ^= uint8array[i];
    }
    uint8array[uint8array.length - 1] = xor;
}

async function devGetAsync() {
    let buffer = new Uint8Array([0x7F]);
    await checkWriteRead(buffer);
}

async function devSetAddrMSB(buffer) {
    extendAddr[0] = buffer[4];
    extendAddr[1] = buffer[5];
    console.log("extend address 0x"+uint8Array2HexStr(extendAddr));
}

async function devEraseAll() {
    let command = new Uint8Array([0x43, 0xBC]);
    await checkWriteRead(command);
    let field = new Uint8Array([0xFF, 0x00]);
    await checkWriteRead(field);
    await delay_ms(100);
}

async function devResetToMain() {
    let command = new Uint8Array([0x21, 0xDE]);
    await checkWriteRead(command);
    let addr = new Uint8Array([0x08, 0x00, 0x00, 0x00, 0x08]);
    await checkWriteRead(addr);
}




async function devWriteMemary(block) {
    //console.log(block);
    let command = new Uint8Array([0x31, 0xce]);
    await checkWriteRead(command);

    let addr = new Uint8Array(5);
    addr[0] = extendAddr[0];
    addr[1] = extendAddr[1];
    addr[2] = block[1];
    addr[3] = block[2];
    fillXOR(addr);
    await checkWriteRead(addr);

    let data = new Uint8Array(block.length - 3);
    data[0] = data.length-3;
    for (let i = 1; i < data.length-1; i++) {
        data[i] = block[i + 3];
    }
    fillXOR(data);
    // console.log(uint8Array2HexStr(data));
    await checkWriteRead(data);
}


async function checkWriteRead(buffer) {
    // console.log(buffer);
    await writer.write(buffer);
    await delay_ms(1);
    const { value, done } = await reader.read();
    if (value[0] === 0x79) {
        return true;
    } else {
        return false;
    }
}


function delay_ms(nms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, nms);
    });
}


async function sendHexStr(hexStr) {
    if (!isPortOpened) {
        console.log("--- port have not opended ---");
        const toastElement = document.getElementById("toastMsg");
        toastElement.childNodes[1].innerText = "端口未打开";
        let toastInstance = new bootstrap.Toast(toastElement);
        toastInstance.show();
        return;
    }
    let buffer = hexStr2Uint8Array(hexStr);
    await writer.write(buffer);
    console.log("send: " + hexStr);
}



