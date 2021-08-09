var tablearea = document.getElementById('output'),
    table = document.querySelector('table'),
    header = document.querySelector('table thead'),
    body = document.querySelector('table tbody');

function addRow(row, isHeader) {
    var tr = document.createElement('tr');
    for (var i = 0; i < row.length; i++) {

        let td;
        if (isHeader) {
            td = document.createElement('th');
        } else {
            td = document.createElement('td');
        }

        td.appendChild(document.createTextNode(row[i]));
        tr.appendChild(td);

        if (isHeader)
            header.appendChild(tr);
        else
            body.appendChild(tr);
    }
}