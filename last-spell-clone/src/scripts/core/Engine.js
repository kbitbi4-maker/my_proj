export class Engine{
    constructor(){
        console.log('Engine created');
    }
    
    async init(){
        console.log('Engine init');
        return true;
    }
}
