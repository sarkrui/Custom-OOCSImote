$(document).ready(function() {
    connect();
    // var configJSON;
    // var configuration;
    $('.modal').modal();
    // DEFAULT configuration
    //obtain configuration from a local json file
    // var configJSON;
    // $.getJSON('assets/data/config.json', function(configJSON) {
    //     console.log(configJSON.channel);
    //     var configuration = JSON.parse(configJSON);
    // });
    // var configuration = {};
    // $.ajax({
    //     type: 'GET',
    //     dataType: 'json',
    //     url: 'assets/data/config.json',
    //     success: function(response) {
    //         alert(response.channel);
    //         console.log(response);
    //         configuration = response;
    //     },
    //     error: function(data) {
    //         alert("error");
    //     }
    // });
    // var configuration = {};
    // $.getJSON('assets/data/config.json', function(configuration) {
    //     console.log(configuration);
    // });
    var configuration = {
        channel: "flip_channel",
        server: "oocsi.id.tue.nl",
        platform: "ESP32" /* alternatives: ESP8266, Processing, Python, JS */ ,
        controls: [{
            type: "button",
            name: "Light Control",
            par: "light_switch",
            def: false
        }, {
            type: "slider",
            name: "test slider",
            par: "slider1",
            min: 1,
            max: 100,
            def: 45
        }, {
            type: "slider",
            name: "test slider",
            par: "slider1",
            min: 1,
            max: 100,
            def: 45
        }, {
            type: "trigger",
            name: "test trigger",
            par: "trigger1"
        }]
    };
    $('#oocsi_channel').val(configuration.channel);
    configuration.controls.forEach(function(d, i) {
        if (d.type == "trigger") {
            addTrigger(d, i);
        }
        if (d.type == "button") {
            addButton(d, i);
        }
        if (d.type == "slider") {
            addSlider(d, i);
        }
    });
    $('#oocsi_channel').change(function(e) {
        configuration.channel = $(this).val();
        e.preventDefault();
    })
    $('#progress').hide();
    $('#openQRBtn').click(function(e) {
        $('#qrcode').html('');
        var compressedJSON = JSONC.pack(configuration, true);
        var fullLink = 'http://' + configuration.server + window.location.pathname + "/share?" + encodeURIComponent(JSON.stringify(compressedJSON));
        var qrcode = new QRCode("qrcode", {
            text: fullLink,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        $('#codelink a').prop("href", fullLink);
        e.preventDefault();
    });
    $('#connectBtn').click(function(e) {
        configuration.channel = $('#oocsi_channel').val();
        if (configuration.channel.length > 3) {
            // continue
            $('#progress').show();
            $('#controlContainer').hide();
            connect();
        }
        e.preventDefault();
    });
    $('#addTriggerBtn').click(function(e) {
        var trigger = {
            type: "trigger",
            name: $('#nameTt').val(),
            par: $('#parTt').val()
        };
        addTrigger(trigger, configuration.controls.length);
        configuration.controls.push(trigger);
        e.preventDefault();
    });
    $('#addButtonBtn').click(function(e) {
        var button = {
            type: "button",
            name: $('#nameBt').val(),
            par: $('#parBt').val(),
            def: $('#defBt').prop('checked')
        };
        addButton(button, configuration.controls.length);
        configuration.controls.push(button);
        e.preventDefault();
    });
    $('#addSliderBtn').click(function(e) {
        var slider = {
            type: "slider",
            name: $('#nameSl').val(),
            par: $('#parSl').val(),
            min: $('#minSl').val(),
            max: $('#maxSl').val(),
            def: $('#minSl').val()
        };
        addSlider(slider, configuration.controls.length);
        configuration.controls.push(slider);
        e.preventDefault();
    });
    $('#moteGenerateESP32Btn').click(function(e) {
        configuration.platform = "ESP32";
        $.ajax({
            type: "POST",
            url: "/generateMoteCode",
            data: JSON.stringify(configuration),
            success: function(data) {
                downloadFile("OOCSImote_" + configuration.channel.replace(/\\s/g, "_") + "_ESP32.ino", data);
            },
            contentType: "application/json"
        });
        e.preventDefault();
    });
    $('#moteGenerateProcessingBtn').click(function(e) {
        configuration.platform = "Processing";
        $.ajax({
            type: "POST",
            url: "/generateMoteCode",
            data: JSON.stringify(configuration),
            success: function(data) {
                downloadFile("OOCSImote_" + configuration.channel.replace(/\\s/g, "_") + ".pde", data);
            },
            contentType: "application/json"
        });
        e.preventDefault();
    });

    function addTrigger(trigger, index) {
        $('#controlContainer').append(generateTrigger(trigger, index));
        $('#control' + index).click(function(e) {
            dispatch(trigger, true);
            e.preventDefault();
        });
        $('#delBtn' + index).click(function(e) {
            $('#control' + index).parent().parent().remove();
            configuration.controls[index] = {};
            e.preventDefault();
        });
    }

    function addButton(button, index) {
        $('#controlContainer').append(generateButton(button, index));
        if (button.def) {
            $('#control' + index).prop('checked', true);
        }
        $('#control' + index).change(function(e) {
            dispatch(button, $(this).prop('checked'));
            e.preventDefault();
        });
        $('#delBtn' + index).click(function(e) {
            $('#control' + index).parent().parent().parent().parent().remove();
            configuration.controls[index] = {};
            e.preventDefault();
        });
    }

    function addSlider(slider, index) {
        $('#controlContainer').append(generateSlider(slider, index));
        $('#control' + index).on("input", function(e) {
            dispatch(slider, parseInt($(this).val()));
            e.preventDefault();
        });
        $('#delBtn' + index).click(function(e) {
            $('#control' + index).parent().parent().remove();
            configuration.controls[index] = {};
            e.preventDefault();
        });
    }

    function generateTrigger(trigger, index) {
        return '<div class="card row" style="padding: 2em;"><div class="col s4 m2"><label for="control' + index + '">' + trigger.name + '</label></div><div class="col s8"><a href="#" id="control' + index + '" class="btn">' + trigger.name + '</a></div><div class="col m2 hide-on-small-only"><a class="btn-flat red-text" id="delBtn' + index + '">delete</a></div></div>';
    }

    function generateButton(button, index) {
        return '<div class="card row" style="padding: 2em;"><div class="col s4 m2"><label for="control' + index + '">' + button.name + '</label></div><div class="col s8"><div class="switch"><label>Off<input id="control' + index + '" type="checkbox"><span class="lever"></span>On</label></div></div><div class="col m2 hide-on-small-only"><a class="btn-flat red-text" id="delBtn' + index + '">delete</a></div></div>';
    }

    function generateSlider(slider, index) {
        return '<div class="card row" style="padding: 2em;"><div class="col s4 m2"><label for="control' + index + '">' + slider.name + '</label></div><div class="range-field col s8"><input type="range" id="control' + index + '" min="' + slider.min + '" max="' + slider.max + '" value="' + slider.def + '" /></div><div class="col m2 hide-on-small-only"><a  class="btn-flat red-text" id="delBtn' + index + '">delete</a></div></div>';
    }

    function connect() {
        // connect to OOCSI server
        $.getJSON('assets/data/config.json', function(configJSON) {
            OOCSI.connect("wss://" + configJSON.server + "/ws");
            //configuration = JSON.parse(configJSON);
            setTimeout(function() {
                $('#progress').hide();
                $('#controlContainer').show();
            }, 1000);
            setInterval(function() {
                // check connection
                if (!OOCSI.isConnected()) {
                    $('#connectionBtn').addClass('red').removeClass('green');
                    OOCSI.connect("wss://oocsi.id.tue.nl/ws");
                    console.log("(re)connected");
                } else {
                    $('#connectionBtn').removeClass('red').addClass('green');
                }
            }, 500);
        });
    }

    function dispatch(element, value) {
        console.log(element.name + ' changed to ' + value);
        var data = {};
        data[element.par] = value;
        OOCSI.send(configuration.channel, data);
    }

    function downloadFile(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:application/zip;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
});