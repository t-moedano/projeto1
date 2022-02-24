const RESPONSIBLE_NUMBER = '4442';
function postTransaction() {
    //validate fields
    let value = document.getElementById("name-value").value;
    const merchantName = document.getElementById("name-merchant").value;
    const transactionType = document.getElementById("transaction").value;
    if(!value || !merchantName || !transactionType) {
        alert("Todos os campos são obrigatórios!");
        return;
    }

    value = value.replace(',', '.');
    value = parseFloat(value);
    if(transactionType == "-" ) {
        value = value * -1;
    }
    postToAirTable(value, merchantName, transactionType);

}

function loadInfoToTable(table) {
    getInfoFromAirTable(RESPONSIBLE_NUMBER)
    .then(merchantItems => createTableFromArray(table, merchantItems.records));
}

function createTableFromArray(table, merchantItemsArray) {

    //sum result
    let finalResult = 0;

    // Clear Table
    let tableBody = table.querySelector('tbody');
    tableBody.innerHTML = "<tr></tr>";

    if(merchantItemsArray.length === 0) {
        let text = 'Não há transações cadastradas';
        let rowElement = document.createElement('tr');
        generateCellElement('', rowElement, false);
        generateCellElement(text, rowElement, true);
        generateCellElement('', rowElement, false);
        tableBody.appendChild(rowElement);
    }

    // Add Items
    for (const item of merchantItemsArray) {
        const rowElement = document.createElement('tr');
        console.log(item);
        console.log(item.fields);
        const jsonField = JSON.parse(item.fields.Json);
        let value = jsonField[0].value; // STOPPED HERE, --- INCLUINDO OS VALORES DO CAMPO NO JSON PRA CRIAR AS ROWS DA TABELA
        if(value) {
            
            finalResult += value;
            value = value.toFixed(2);
            value = "R$ " + value;
            value = value.replace('.', ',');
        }
        const type = jsonField[0].type;
        const name = jsonField[0].name;
        generateCellElement(type, rowElement, false);
        generateCellElement(name, rowElement, true);
        generateCellElement(value, rowElement, false);
        tableBody.appendChild(rowElement);
    }

    // generate sum
    let sum = document.getElementById('sum');
    console.log(finalResult);
    let finalResultText = finalResult.toFixed(2);
    finalResultText = "R$ " + finalResultText;
    sum.innerHTML = finalResultText;

    // generate text
    let text = document.getElementById('result');
    if(finalResult >= 0) {
        text.innerHTML = '[LUCRO]';
    }
    else {
        text.innerHTML = '[PREJUÍZO]'
    }
}

function generateCellElement(textContent, rowElement, isCenter) {
    const cellElement = document.createElement('td');
    cellElement.textContent = textContent;
    cellElement.classList.add('row-style');
    cellElement.classList.add('font-size');

    if(isCenter) {
        cellElement.textContent = '';
        cellElement.classList.add('center')
        const divElement = document.createElement('div');
        divElement.classList.add('block-style');
        divElement.innerHTML = textContent;
        cellElement.appendChild(divElement);
    }
    rowElement.appendChild(cellElement);
}

function getInfoFromAirTable(responsible) {
    return fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico?filterByFormula='+encodeURI(`{Responsavel} = '${responsible}'`), {
        method: 'GET',
        headers: {
            Authorization: 'Bearer key2CwkHb0CKumjuM',
            'Content-Type': 'application/json'
        },
    })
    .then(response => { return response.json() })
    .then(json => { return json });
}

function postToAirTable(value, merchantName, transactionType) {
    fetch('https://api.airtable.com/v0/appRNtYLglpPhv2QD/Historico', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer key2CwkHb0CKumjuM',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                records: [
                    {
                        fields: {
                            Responsavel: RESPONSIBLE_NUMBER,
                            Json: JSON.stringify([
                                {
                                    type: transactionType,
                                    name: merchantName,
                                    value
                                }
                            ])
                        }
                    }
                ]
            }
        )
    })
    .then(response => { return response.json() })
    .then(json => loadInfoToTable(document.querySelector('table')));
}

