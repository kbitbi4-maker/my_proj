// Конфигурация игры
export const GAME_CONFIG={
    version:'1.0.2.21',
    title:'Эльдерлихт #4',
    subtitle:'Апокалипсис 2',
    menu:{
        buttons:[
            {id:'btn1',label:'Продолжить',action:'continue'},
            {id:'btn2',label:'Настройки',action:'settings'},
            {id:'btn3',label:'Авторы',action:'credits'},
            {id:'btn4',label:'Выйти',action:'exit'}
        ]
    },
    audio:{
        menuMusic:{
            volume:0.5,
            loop:true
        }
    },
    graphics:{
        pixelSize:2,
        resolution:{width:800,height:600}
    }
};
