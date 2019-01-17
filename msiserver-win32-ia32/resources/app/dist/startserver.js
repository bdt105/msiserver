var $ = require('jquery'); // jQuery now loaded and assigned to $
var msiserver = require('./dist/msiapiserver');
var msiservr = new msiserver.MsiApiServer();
$('#startserverbtn').on('click', function () {
    msiservr.initApi();
});
$('#stopserverbtn').on('click', function () {
    msiservr.stopApi();
});
$('#saveconfigurationbtn').on('click', function () {
    msiservr.saveConfiguration($('#configurationPort').val(), $('#configurationDestination').val());
    initConfiguration();
});
setInterval(function () {
    $('#log').html(msiservr.getLogs());
    if (msiservr.getStatus()) {
        $('#serverStatus').html("<span style='color: green'>ON</span>");
    }
    else {
        $('#serverStatus').html("<span style='color: red'>OFF</span>");
    }
}, 1000);
initConfiguration();
function initConfiguration() {
    var conf = msiservr.getConfiguration();
    if (!conf) {
        msiservr.loadConfiguration();
        conf = msiservr.getConfiguration();
    }
    $('#configurationPort').val(conf.common.port);
    $('#configurationDestination').val(conf.common.destinationDirectory);
    var os = msiservr.getOs();
    if (os) {
        var ip = msiservr.getIp();
        $('#host').html("<span style='font-style: italic'>" + os.hostname() + " (" + ip + ")" + "</span>");
    }
}
//# sourceMappingURL=startserver.js.map