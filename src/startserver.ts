let $ = require('jquery')  // jQuery now loaded and assigned to $

let msiserver = require('./dist/msiapiserver');
let msiservr = new msiserver.MsiApiServer();

$('#startserverbtn').on('click', () => {
    msiservr.start();
})

$('#stopserverbtn').on('click', () => {
    msiservr.stop();
})

$('#getidentifierbtn').on('click', () => {
    msiservr.getNewIdentifier(
        (data: any, error: any) => {
            $('#identifier').html(data);
        }
    )
})

setInterval(
    () => {
        $('#log').html(msiservr.getLogs());
        $('#serverStatus').html("<br><span style='" + (msiservr.isStarted() ? "color: green'>ON" : "color: red'>OFF") + "</span>");
        $('#currentState').html((msiservr.getNextExecutionDate() ? msiservr.getNextExecutionDate() + " - " : "") + msiservr.getCurrentState());
        $('#countFileCopied').html(msiservr.getCountFileCopied());
        $('#startDate').html(msiservr.getStartDate());
        $('#stopDate').html(msiservr.getStopDate());
        $('#info').html("Identifier: " + msiservr.getIdentifier());
        $("#qrcodeImage").attr("src", msiservr.getQrCodeUrl());
    }, 500
)

initConfiguration();

function initConfiguration() {
    let conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
}