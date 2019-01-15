let $ = require('jquery')  // jQuery now loaded and assigned to $

$('#startserverbtn').on('click', () => {
    let msiserver = require('./dist/msiapiserver');
    let msiservr = new msiserver.MsiApiServer();
    let ret = msiservr.initApi();
    $('#log').text(ret)
})