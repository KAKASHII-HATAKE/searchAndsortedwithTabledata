import { LightningElement,track,api,wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getOpps from '@salesforce/apex/fetchSearchData.getOpps';
import { updateRecord } from 'lightning/uiRecordApi';
import generatePDF from '@salesforce/apex/pdfController.generatePDF';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import IMAGE_LOGO from '@salesforce/resourceUrl/grace'
const columns = [{
    label: 'Name',
    fieldName: 'Name',
    type: 'text',
    sortable: true
},
{
    label: 'Insurance',
    fieldName: 'Insurance_Amount__c',
    sortable: true,
    editable:true
},
{
    label: 'Quantity',
    fieldName: 'Quantity__c',
    sortable: true,
    editable:true
}
];

const column = [{
    label: 'Name',
    fieldName: 'Name',
},
{
    label: 'Insurance Ammount',
    fieldName: 'Insurance_Amount__c',editable:true,
},
{
    label: 'Quantity',
    fieldName: 'Quantity__c',editable:true,
}
];

export default class GraceRelocationDemo extends LightningElement {
    @api recordId
    toggleview=false
    @track selectedRowsData=[]
    @track value;
    @track error;
    @track data;
    @api sortedDirection = 'asc';
    @api sortedBy = 'Name';
    @api searchKey = '';
    result;
    @track selectedData = [];
    
    @track page = 1; 
    @track items = []; 
    @track data = []; 
    @track columns; 
    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize =10; 
    @track totalRecountCount = 0;
    @track totalPage = 0;
    // get selectedData() {
    //     return Object.values(this._selectedData)
    // } 
    // image=IMAGE_LOGO
    @wire(getOpps, {searchKey: '$searchKey', sortBy: '$sortedBy', sortDirection: '$sortedDirection'})
    wiredAccounts(refreshResult) {
        this.result=refreshResult
        const {data,error} =refreshResult
        if (data) {
        
            this.items = data;
            console.log('my data ',data)
            this.totalRecountCount = data.length; 
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
            
            this.data = this.items.slice(0,this.pageSize); 
            this.endingRecord = this.pageSize;
            this.columns = columns;

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.data = undefined;
        }
    }

    //clicking on previous button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    //this method displays records page by page
    displayRecordPerPage(page){

        this.startingRecord = ((page -1) * this.pageSize) ;
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount) 
                            ? this.totalRecountCount : this.endingRecord; 

        this.data = this.items.slice(this.startingRecord, this.endingRecord);

        this.startingRecord = this.startingRecord + 1;
    }    
    
    sortColumns( event ) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        return refreshApex(this.result);
        
    }
  
    handleKeyChange( event ) {
        this.searchKey = event.target.value;
        return refreshApex(this.result);
    }

    @track draftValues=[]
    @track selectedRowsData=[]
    handleSave(event){

        console.log('draft values ',event.detail.draftValues)
        console.log(JSON.stringify(event.detail.draftValues))

        const recordInputs=event.detail.draftValues.map(draft=>{
            const fields = {...draft};
            return { fields:fields };
        })
     //  const mydraft=event.detail.draftValues
        const promises = recordInputs.map(recordInput=>updateRecord(recordInput))
        Promise.all(promises).then(()=>{
            console.log('EQ product updated Successfully')
            this.draftValues=[]
            this.selectedData=[]
            refreshApex(this.result)
        }).catch(error=>{
            console.error("Error updating the record", error)
        })
       // this.showChangedRows(mydraft)
    }

    // showChangedRows(mydraft)
    // {
        
    //     const selectedRows =mydraft
    //     for (let i = 0; i < selectedRows.length; i++) {
  
            
    //         this.selectedRowsData.push({
    //             Id:selectedRows[i].Id,
    //             Name:selectedRows[i].Name,
    //             Insurance:selectedRows[i].Insurance_Ammount__c, 
    //             Quantity:selectedRows[i].Quantity__c
  
    //         })
    //         console.log('inside show change rows',selectedRows)
    // }

    getSelectedName(event)
    {
    console.log('my selectedRowsData ',event.detail.selectedRows)
    console.log('my record id ',this.recordId)

    const selectedRows = event.detail.selectedRows;


    for (let i = 0; i < selectedRows.length; i++) {
        // this._selectedData[selectedRows[i].id] = {
        //                                             Id:selectedRows[i].Id,
        //                                             Name:selectedRows[i].Name,
        //                                             Insurance:selectedRows[i].Insurance_Amount__c, 
        //                                             Quantity:selectedRows[i].Quantity__c
        //                                             }
        if ( !this.selectedData.includes(selectedRows[i]) ) {
            this.selectedData =[...this.selectedData,     selectedRows[i]];
        }
        

        // this.selectedRowsData.push({
        // Id:selectedRows[i].Id,
        // Name:selectedRows[i].Name,
        // Insurance:selectedRows[i].Insurance_Amount__c, 
        // Quantity:selectedRows[i].Quantity__c

        //   })
          //console.log('inside loop ',selectedRows[i].Insurance_Amount__c)
     }
    // this.selectedRowsData=[...new Map(this.selectedRowsData.map(v => [v.id, v])).values()]
     console.log("selectedData ",this.selectedData)
    }

   pdfHandler()
    {
        
        let content = this.template.querySelector('.container')
        console.log(content.outerHTML)
         generatePDF({recordId:this.recordId,htmlData:content.outerHTML}).then(result=>{

            const event = new ShowToastEvent({ 
                title :'Success',
                message:'Articles to be Moved Document Created Successfully',
                variant:'success',
                
            })
            this.dispatchEvent(event)

            console.log("attachment id", result)
        }).catch(error=>{
            console.error(error)
        })
    }

    viewToggle()
    {
        this.toggleview=!this.toggleview
    }


}