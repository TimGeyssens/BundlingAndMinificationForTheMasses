var data = [];


function FillData() {

    data.VirtualPath = $('#VirtualPath').val();
    data.Files = [];
    $('#selected_files .file').each(function () {
        data.Files.push($(this).attr('rel'));
    });
    data.Directories = [];
    $('#selected_files .directory').each(function () {
        data.Directories.push($(this).attr('rel'));
    });
}

$(document).ready(function () {
    $('#file_tree').fileTree({
        script: 'Services/jqueryfiletree.aspx',
        root: '@startDir',
        fileFilter: '@filter',
    }, function (file) {

        file = '~' + file;
        if (!_.contains(data.Files, file)) {
            $('#selected_files').append('<li class="file ext_@ext" rel="' + file + '">' + file + ' <span class="delete">Remove</span></li>');

            data.Files.push(file);
        }

    }, function (folder) {

        folder = '~' + folder;
        if (!_.contains(data.Directories, folder)) {
            $('#selected_files').append('<li class="directory" rel="' + folder + '">' + folder + ' <span class="delete">Remove</span></li>');

            data.Directories.push(folder);
        }
    });

    $(document).on("click", ".delete", function () {
        data.Files.splice(data.Files.indexOf($(this).parent().attr('rel')), 1);
        data.Directories.splice(data.Directories.indexOf($(this).parent().attr('rel')), 1);
        $(this).parent().remove();

    });

    $("#selected_files").sortable();

    FillData();

    $('#save').click(function (event) {

        FillData();

        var model = {
            VirtualPath: $('#VirtualPath').val(),
            Files: data.Files
        };

        $.ajax({
            type: "POST",
            url: 'api/PostBundleUpdate?bundleType=@Request["bundleType"]',
            dataType: 'json',
            contenttype: 'application/json; charset=utf-8',
            data: model,
            success: function () {

                alert("Saved");
            }
        });


        event.preventDefault();

    });

});