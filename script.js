
const listaParticipantes = document.querySelector("#lista-participantes");
const valorAluguel = document.querySelector("#valor-aluguel");
const contador = document.querySelector("#contador");
const mensagem = document.querySelector("#mensagem");
const resultado = document.querySelector("#resultado");
const listaResultados = document.querySelector("#lista-resultados");
const mensagemCopia = document.querySelector("#mensagem-copia");

const botaoAdicionar = document.querySelector("#adicionar");
const botaoCalcular = document.querySelector("#calcular");
const botaoCopiar = document.querySelector("#copiar");

// Elementos do Pix
const pixResponsavel = document.querySelector("#pix-responsavel");
const pixExibido = document.querySelector("#pix-exibido");
const botaoCopiarPix = document.querySelector("#copiar-pix");

let ultimoRateio = null;

// Formata valores em reais
const formatarMoeda = valor =>
    valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

// Atualiza a quantidade de participantes
function atualizarContador() {
    const quantidade = listaParticipantes.querySelectorAll(
        ".participante"
    ).length;

    contador.textContent =
        `${quantidade} ${quantidade === 1 ? "pessoa" : "pessoas"}`;
}

// Adiciona um participante à lista
function adicionarParticipante(nome = "", horas = "") {
    const linha = document.createElement("div");
    linha.className = "participante";

    // Campo do nome
    const campoNome = document.createElement("div");
    campoNome.className = "campo";

    const labelNome = document.createElement("label");
    labelNome.textContent = "Nome";

    const inputNome = document.createElement("input");
    inputNome.type = "text";
    inputNome.className = "nome";
    inputNome.placeholder = "Ex.: Ana";
    inputNome.maxLength = 80;
    inputNome.value = nome;
    inputNome.setAttribute("aria-label", "Nome do participante");

    campoNome.append(labelNome, inputNome);

    // Campo das horas jogadas
    const campoHoras = document.createElement("div");
    campoHoras.className = "campo";

    const labelHoras = document.createElement("label");
    labelHoras.textContent = "Horas jogadas";

    const inputHoras = document.createElement("input");
    inputHoras.type = "number";
    inputHoras.className = "horas";
    inputHoras.placeholder = "Ex.: 2";
    inputHoras.min = "0.01";
    inputHoras.step = "any";
    inputHoras.value = horas;
    inputHoras.setAttribute("aria-label", "Horas jogadas");

    campoHoras.append(labelHoras, inputHoras);

    // Botão para remover participante
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "remover";
    remover.textContent = "×";
    remover.title = "Remover participante";
    remover.setAttribute("aria-label", "Remover participante");

    remover.addEventListener("click", () => {
        linha.remove();

        atualizarContador();

        resultado.hidden = true;
        mensagem.textContent = "";
        mensagemCopia.textContent = "";
        ultimoRateio = null;
    });

    linha.append(campoNome, campoHoras, remover);
    listaParticipantes.appendChild(linha);

    atualizarContador();

    resultado.hidden = true;
    mensagem.textContent = "";
    ultimoRateio = null;
}

// Botão de adicionar participante
botaoAdicionar.addEventListener("click", () => {
    adicionarParticipante();
});

// Lê e valida os participantes
function obterParticipantes() {
    const linhas = [
        ...listaParticipantes.querySelectorAll(".participante")
    ];

    if (linhas.length === 0) {
        throw new Error("Adicione pelo menos um participante.");
    }

    return linhas.map((linha, indice) => {
        const nome = linha.querySelector(".nome").value.trim();
        const horasTexto = linha.querySelector(".horas").value.trim();
        const horas = Number(horasTexto);

        if (!nome) {
            throw new Error(
                `Informe o nome do participante ${indice + 1}.`
            );
        }

        if (
            !horasTexto ||
            !Number.isFinite(horas) ||
            horas <= 0
        ) {
            throw new Error(
                `Informe um tempo válido para ${nome}.`
            );
        }

        return {
            nome,
            horas,
            centavos: 0
        };
    });
}

// Divide o aluguel proporcionalmente às horas jogadas
// e distribui eventuais centavos restantes.
function distribuirValores(participantes, totalCentavos) {
    const totalHoras = participantes.reduce(
        (soma, pessoa) => soma + pessoa.horas,
        0
    );

    if (!Number.isFinite(totalHoras) || totalHoras <= 0) {
        throw new Error("O total de horas jogadas precisa ser válido.");
    }

    const valoresExatos = participantes.map((pessoa, indice) => {
        const exato = totalCentavos * pessoa.horas / totalHoras;

        return {
            ...pessoa,
            centavos: Math.floor(exato),
            fracao: exato - Math.floor(exato),
            indice
        };
    });

    const centavosRestantes = totalCentavos -
        valoresExatos.reduce(
            (soma, pessoa) => soma + pessoa.centavos,
            0
        );

    // Os maiores restos recebem os centavos que faltam.
    const ordem = [...valoresExatos].sort((a, b) =>
        b.fracao - a.fracao || a.indice - b.indice
    );

    for (let i = 0; i < centavosRestantes; i++) {
        ordem[i].centavos++;
    }

    // Retorna à ordem original dos participantes.
    return valoresExatos
        .sort((a, b) => a.indice - b.indice)
        .map(({ fracao, indice, ...pessoa }) => pessoa);
}

// Calcula e exibe o rateio
function calcularRateio() {
    mensagem.textContent = "";
    mensagemCopia.textContent = "";
    resultado.hidden = true;
    ultimoRateio = null;

    try {
        const aluguelTexto = valorAluguel.value.trim();
        const aluguel = Number(aluguelTexto);

        if (
            !aluguelTexto ||
            !Number.isFinite(aluguel) ||
            aluguel <= 0
        ) {
            throw new Error("Informe um valor de aluguel válido.");
        }

        const totalCentavos = Math.round(aluguel * 100);

        if (!Number.isSafeInteger(totalCentavos) || totalCentavos < 1) {
            throw new Error("Informe um valor de aluguel válido.");
        }

        const participantes = obterParticipantes();

        const totalHoras = participantes.reduce(
            (soma, pessoa) => soma + pessoa.horas,
            0
        );

        if (!Number.isFinite(totalHoras) || totalHoras <= 0) {
            throw new Error("O total de horas jogadas é inválido.");
        }

        const rateio = distribuirValores(
            participantes,
            totalCentavos
        );

        const chavePix = pixResponsavel.value.trim();

        // Atualiza o resumo do aluguel
        document.querySelector("#total-aluguel").textContent =
            formatarMoeda(totalCentavos / 100);

        document.querySelector("#total-horas").textContent =
            `${totalHoras.toLocaleString("pt-BR")} h`;

        // Exibe a chave Pix informada pelo responsável
        pixExibido.textContent = chavePix || "Não informado";

        // Limpa os resultados anteriores
        listaResultados.replaceChildren();

        // Exibe o valor de cada participante
        rateio.forEach(pessoa => {
            const item = document.createElement("div");
            item.className = "item-resultado";

            const detalhes = document.createElement("div");
            detalhes.className = "detalhes";

            const nome = document.createElement("div");
            nome.className = "nome-resultado";
            nome.textContent = pessoa.nome;

            const horas = document.createElement("div");
            horas.className = "horas-resultado";
            horas.textContent =
                `${pessoa.horas.toLocaleString("pt-BR")} h jogadas`;

            const valor = document.createElement("div");
            valor.className = "valor-resultado";
            valor.textContent = formatarMoeda(
                pessoa.centavos / 100
            );

            detalhes.append(nome, horas);
            item.append(detalhes, valor);
            listaResultados.appendChild(item);
        });

        // Guarda os dados usados no resultado exibido
        ultimoRateio = {
            aluguel: totalCentavos,
            totalHoras,
            chavePix,
            participantes: rateio
        };

        resultado.hidden = false;

        resultado.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (erro) {
        mensagem.textContent = erro.message;
    }
}

// Botão de calcular
botaoCalcular.addEventListener("click", calcularRateio);

// Copia o resumo completo, incluindo a chave Pix
botaoCopiar.addEventListener("click", async () => {
    if (!ultimoRateio) {
        mensagemCopia.textContent =
            "Calcule o rateio antes de copiar o resumo.";
        return;
    }

    const dados = ultimoRateio;

    const linhas = [
        "🏐 Racha da Quadra",
        "",
        `Valor total do aluguel: ${formatarMoeda(dados.aluguel / 100)}`,
        `Pix para pagamento: ${dados.chavePix || "Não informado"}`,
        `Total de horas-pessoa: ${dados.totalHoras.toLocaleString("pt-BR")} h`,
        "",
        "💰 Valor por participante:"
    ];

    dados.participantes.forEach(pessoa => {
        linhas.push(
            `${pessoa.nome} — ${pessoa.horas.toLocaleString("pt-BR")} h — ${formatarMoeda(pessoa.centavos / 100)}`
        );
    });

    linhas.push(
        "",
        "Os valores foram divididos proporcionalmente às horas jogadas."
    );

    try {
        await navigator.clipboard.writeText(linhas.join("\n"));

        mensagemCopia.textContent =
            "Resumo copiado! Agora é só enviar no grupo.";

    } catch {
        mensagemCopia.textContent =
            "Não foi possível copiar automaticamente. Copie os dados da tela.";
    }
});

// Copia apenas a chave Pix
botaoCopiarPix.addEventListener("click", async () => {
    const chave = pixResponsavel.value.trim();

    if (!chave) {
        mensagemCopia.textContent =
            "Informe uma chave Pix primeiro.";
        return;
    }

    try {
        await navigator.clipboard.writeText(chave);

        mensagemCopia.textContent = "Chave Pix copiada!";

    } catch {
        mensagemCopia.textContent =
            "Não foi possível copiar automaticamente. Copie a chave Pix exibida na tela.";
    }
});

// Atualiza o resultado se o responsável mudar a chave Pix
pixResponsavel.addEventListener("input", () => {
    resultado.hidden = true;
    mensagemCopia.textContent = "";
    ultimoRateio = null;
});

// Inicia o site com um participante
adicionarParticipante();
