class UserController {

    constructor(formIdCreate, formIdUpdate, tableId){

        this.formEL = document.getElementById(formIdCreate);
        this.formUpdateEL = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    };

    onEdit(){

        document.querySelector('#box-user-update .btn-cancel').addEventListener("click",e=>{

            this.showPanelCreate();

        });

        this.formUpdateEL.addEventListener("submit", e=>{

            e.preventDefault();

            let btn = this.formUpdateEL.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formUpdateEL);

            let index = this.formUpdateEL.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values)

            

            tr.dataset.user = JSON.stringify(result);

            
            

            

            

            this.getPhoto(this.formUpdateEL).then((content) => {

                if(!values.photo){
                    result._photo = userOld._photo;
                } else {
                    result._photo = content;

                }

                console.log(values);

                let user = new User();

                user.loadFromJSON(result);

                this.getTr(user, tr);

                this.updateCount();


                this.formEL.reset();
                this.showPanelCreate();
                btn.disabled = false;

            }, (e) => {

                console.error(e);

            });


        });

    };

    onSubmit(){
        
        this.formEL.addEventListener("submit", e=>{

            e.preventDefault();

            let btn = this.formEL.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formEL);

            if (!values) return;

            values.photo = "";

            this.getPhoto(this.formEL).then((content) => {

                values.photo = content;

                
                this.insert(values);
                
                this.addLine(values);

                this.formEL.reset();

                btn.disabled = false;

            }, (e) => {

                console.error(e);

            });

            

        });

    }

    getPhoto(formEL){

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...this.formEL.elements].filter(item=>{

            if (item.name === 'photo') {
                return item;
            };
            });

            let file = elements[0].files[0];

            file ? fileReader.readAsDataURL(file) : resolve('dist/img/boxed-bg.jpg');

            fileReader.onload = () => {

                
                resolve(fileReader.result);

            };

            fileReader.onerror = (e) => {

                reject(e);

            }

        });

        

        

    }


    getValues(formEl){

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach((field, index)=>{

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value){

                field.parentElement.classList.add('has-error');
                isValid = false;

            }

            if (field.name == "gender") {
    
                if (field.checked) {
                    user[field.name] = field.value;
                }
    
            } else if (field.name === "admin"){

                user[field.name] = field.checked;

            } else {
    
                user[field.name] = field.value;
    
            }
    
        });

        if (!isValid) return false;
    
        return new User(
            user.name, 
            user.gender, 
            user.birth, 
            user.country, 
            user.email, 
            user.password, 
            user.photo, 
            user.admin
        );

    };

    getUsersStorage(){

        let users = [];

        if (localStorage.getItem("users")){

            users = JSON.parse(localStorage.getItem("users"));

        }

        return users;

    }

    selectAll(){

        let users = this.getUsersStorage();

        users.forEach(data=>{

            let user = new User();

            user.loadFromJSON(data);

            this.addLine(user);
        });

    }

    insert(data){

        let users = this.getUsersStorage();

        users.push(data);

        //sessionStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("users", JSON.stringify(users));

    }

    addLine(dataUser) {

        let tr = this.getTr(dataUser);
    
        this.tableEl.appendChild(tr);

        this.updateCount();
    
    }

    getTr(dataUser, tr = null){

        if (tr === null) tr = document.createElement("tr");

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
        <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
        <td>${dataUser.name}</td>
        <td>${dataUser.email}</td>
        <td>${dataUser.admin ? "Sim" : "Não"}</td>
        <td>${Utils.dateFormat(dataUser.register)}</td>
        <td>
            <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
            <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
        </td>
        `;

        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr){

        tr.querySelector(".btn-delete").addEventListener("click", e=>{

            if (confirm("Deseja realmente excluir?")) {

                tr.remove();
                this.updateCount();

            }

        });

        tr.querySelector(".btn-edit").addEventListener("click", e=>{

            let json = JSON.parse(tr.dataset.user);

            this.formUpdateEL.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json){

                let field = this.formUpdateEL.querySelector(`[name=${name.replace("_", "")}]`);


                if(field){

                    switch (field.type){

                        case 'file':
                        continue;

                        case 'radio':
                            field = this.formUpdateEL.querySelector(`[name=${name.replace("_", "")}][value=${json[name]}]`);
                            field.checked = true;
                        break;

                        case 'checkbox':
                            field.checked = json[name];
                        break;

                        default:
                            field.value = json[name];


                    }
         
                }
                

            };

            this.formUpdateEL.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();

           

        });

    }

    showPanelCreate(){
        document.querySelector('#box-user-create').style.display = "block";
        document.querySelector('#box-user-update').style.display = "none";
    }
    
    showPanelUpdate(){
        document.querySelector('#box-user-create').style.display = "none";
        document.querySelector('#box-user-update').style.display = "block";
    }


    updateCount(){

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr=>{

            numberUsers++;

            let user = JSON.parse(tr.dataset.user);

            if (user._admin){

                numberAdmin++;

            }

        });



        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;

    };

}