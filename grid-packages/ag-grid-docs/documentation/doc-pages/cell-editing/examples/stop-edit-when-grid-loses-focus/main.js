const gridOptions = {
    columnDefs: [
        {field: 'athlete', minWidth: 160},
        {field: 'age'},
        {field: 'country', minWidth: 140},
        {field: 'year', cellEditor: 'yearCellEditor'},
        {field: 'date', minWidth: 140},
        {field: 'sport', minWidth: 160},
        {field: 'gold'},
        {field: 'silver'},
        {field: 'bronze'},
        {field: 'total'},
    ],
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
        editable: true,
    },
    components: {
        yearCellEditor: getYearCellEditor()
    },
    // this property tells grid to stop editing if the
    // grid loses focus
    stopEditingWhenCellsLoseFocus: true
};

function getYearCellEditor() {
    class YearCellEditor {
        constructor() {
        }

        getGui() {
            return this.eGui;
        }

        getValue() {
            return this.value;
        }

        isPopup() {
            return true;
        }

        init(params) {
            this.value = params.value;
            const tempElement = document.createElement('div');
            tempElement.innerHTML =
                '<div class="yearSelect">' +
                '<div>Clicking here does not close the popup!</div>' +
                '<button id="bt2006" class="yearButton">2006</button>' +
                '<button id="bt2008" class="yearButton">2008</button>' +
                '<button id="bt2010" class="yearButton">2010</button>' +
                '<button id="bt2012" class="yearButton">2012</button>' +
                '<div>' +
                '<input type="text" style="width: 100%;" placeholder="clicking on this text field does not close"/>' +
                '</div>' +
                '</div>';

            const that = this;
            [2006, 2008, 2010, 2012].forEach(year => {
                tempElement.querySelector('#bt' + year).addEventListener('click', () => {
                    that.value = year;
                    params.stopEditing();
                });
            });

            this.eGui = tempElement.firstChild;
        }
    }

    return YearCellEditor;
}

// setup the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector('#myGrid');
    new agGrid.Grid(gridDiv, gridOptions);

    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then(response => response.json())
        .then(data => gridOptions.api.setRowData(data));
});
