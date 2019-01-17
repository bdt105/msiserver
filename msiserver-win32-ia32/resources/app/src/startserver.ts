let $ = require('jquery')  // jQuery now loaded and assigned to $

let msiserver = require('./dist/msiapiserver');
let msiservr = new msiserver.MsiApiServer();

$('#startserverbtn').on('click', () => {
    msiservr.initApi();
})

$('#stopserverbtn').on('click', () => {
    msiservr.stopApi();
})

$('#saveconfigurationbtn').on('click', () => {
    msiservr.saveConfiguration($('#configurationPort').val(), $('#configurationDestination').val());
    initConfiguration();
})

setInterval(
    () => {
        $('#log').html(msiservr.getLogs());
        if (msiservr.getStatus()) {
            $('#serverStatus').html("<span style='color: green'>ON</span>");
        } else {
            $('#serverStatus').html("<span style='color: red'>OFF</span>");
        }
    }, 1000
)

initConfiguration();

function initConfiguration() {
    let conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
    $('#configurationPort').val(conf.common.port);
    $('#configurationDestination').val(conf.common.destinationDirectory);
    let os = msiservr.getOs();
    if (os) {
        let ip = msiservr.getIp();
        $('#host').html("<span style='font-style: italic'>" + os.hostname() + " (" + ip + ")" + "</span>");
    }
}