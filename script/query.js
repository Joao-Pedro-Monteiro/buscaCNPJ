


document.getElementById('div1-searchForm').addEventListener('submit', function(event){
    event.preventDefault();
    query();
})

function query(){

    const div2 = document.getElementById('div2');
    const div3 = document.getElementById('div3');
    let cnpj = document.getElementById("div1-searchInput").value;

    //REMOVE NÃO NÚMEROS 
    cnpj = cnpj.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (cnpj.length !== 14) {

        document.getElementById("div1-searchInput").value = "";
        document.getElementById("div1-searchInput").setAttribute("placeholder", "CNPJ INVÁLIDO — deve ter mais de 14 números");
        document.getElementById("div1-searchInput").style.backgroundColor = "#ffcccc";

        setTimeout(() => {
            document.getElementById("div1-searchInput").style.backgroundColor = "";
            document.getElementById("div1-searchInput").setAttribute("placeholder", "Digite o CNPJ");
        }, 1500);
        return;
    }
    
    try {
        fetch(`https://minhareceita.org/${cnpj}`)
        .then(response => response.json())
        .then(data => {
            console.log("CNPJ COSULTADO: "+cnpj, data);
            
            //* data plot in html
            document.getElementById('razao_social').innerText = data.razao_social;
            document.getElementById('nome_fantasia').innerText = isNull(data.nome_fantasia) ? "Não informado" : data.nome_fantasia;
            document.getElementById('cnae_fiscal_descricao').innerText = isNull(data.cnae_fiscal_descricao) ? "Não informado" : data.cnae_fiscal_descricao;
            document.getElementById('data_inicio_atividade').innerText = isNull(data.data_inicio_atividade) ? "Não informado" : parseDate(data.data_inicio_atividade);
            document.getElementById("pais").innerText = isNull(data.pais) ? "BRASIL" : data.pais;
            document.getElementById("uf").innerText = isNull(data.uf) ? "Não informado" : data.uf;
            document.getElementById('cep').innerText = isNull(data.cep) ? "Não informado" : data.cep;
            document.getElementById('municipio').innerText = isNull(data.municipio) ? "Não informado" : data.municipio;
            document.getElementById('bairro').innerText = isNull(data.bairro) ? "Não informado" : data.bairro;
            document.getElementById('logradouro').innerText = isNull(data.logradouro) ? "Não informado" : data.logradouro;
            document.getElementById('numero').innerText = isNull(data.numero) ? "Não informado" : data.numero;
            document.getElementById('complemento').innerText = isNull(data.complemento) ? "Não informado" : data.complemento;
            document.getElementById('capital_social').innerText = isNull(data.capital_social) ? "Não informado" : data.capital_social.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('telefone1').innerText = isNull(data.ddd_telefone_1) ? "Não informado" : parsePhone(data.ddd_telefone_1); 
            document.getElementById('telefone2').innerText = isNull(data.ddd_telefone_2) ? "Não informado" : parsePhone(data.ddd_telefone_2); 
            document.getElementById('natureza_juridica').innerText = isNull(data.natureza_juridica) ? "Não informado" : data.natureza_juridica;
        });

    } catch (error) {
        console.error(`ERRO NA CONSULTA: ${cnpj}`, error);
    }
}

function isNull(v){
    if(v === null || v === undefined || v === ""){
        return true;
    }
    return false;
}

function parsePhone(phone){
    if(phone === null || phone === undefined || phone === ""){
        return false;
    }

    phone.replace(/\D/g, "");

    if(phone.length < 8){
        return false
    }

    response = phone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
    return response;    
};

function parseDate(date){
    if(date === null || date === undefined || date === ""){
        return false;
    }
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`; // Retorna a data no formato "dd/mm/yyyy"
}