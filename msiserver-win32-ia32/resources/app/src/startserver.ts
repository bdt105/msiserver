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
        (data: any, error: any) =>{
            $('#identifier').html(data);
        }
    )
})

setInterval(
    () => {
        $('#log').html(msiservr.getLogs());
        $('#serverStatus').html("<span>" + msiservr.getStatus() + "</span>");
        $('#info').html("Identifier: " + msiservr.getIdentifier() + (msiservr.getNextExecutionDate() ? ", next execution: " + msiservr.getNextExecutionDate() : ""));
    }, 1000
)

initConfiguration();

function initConfiguration() {
    let conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
}