let $ = require('jquery')  // jQuery now loaded and assigned to $

let msiserver = require('./dist/msiapiserver');
let msiservr = new msiserver.MsiApiServer();

$('#startserverbtn').on('click', () => {
    msiservr.initApi();
})

$('#stopserverbtn').on('click', () => {
    msiservr.stopApi();
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