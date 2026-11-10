
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
        "Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY."
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ==========================================
// ROTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        mensagem: "API de tarefas funcionando!",
        status: "online",
        banco: "Supabase",
        versao: "1.0.0"
    });
});

// ==========================================
// READ - LISTAR TAREFAS
// ==========================================

app.get("/api/tarefas", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("tarefas")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao listar:", error.message);

        return res.status(500).json({
            erro: "Não foi possível listar as tarefas."
        });
    }
});

// ==========================================
// READ - BUSCAR TAREFA POR ID
// ==========================================

app.get("/api/tarefas/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("tarefas")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                erro: "Tarefa não encontrada."
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro ao buscar:", error.message);

        return res.status(500).json({
            erro: "Não foi possível buscar a tarefa."
        });
    }
});

// ==========================================
// CREATE - CADASTRAR TAREFA
// ==========================================

app.post("/api/tarefas", async (req, res) => {
    try {
        const { titulo } = req.body;

        if (typeof titulo !== "string" || !titulo.trim()) {
            return res.status(400).json({
                erro: "Informe um título válido."
            });
        }

        const { data, error } = await supabase
            .from("tarefas")
            .insert({
                titulo: titulo.trim(),
                concluida: false
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            mensagem: "Tarefa cadastrada com sucesso!",
            tarefa: data
        });

    } catch (error) {
        console.error("Erro ao cadastrar:", error.message);

        return res.status(500).json({
            erro: "Não foi possível cadastrar a tarefa."
        });
    }
});

// ==========================================
// UPDATE - ATUALIZAR TAREFA
// ==========================================

app.put("/api/tarefas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, concluida } = req.body;

        const atualizacao = {};

        if (titulo !== undefined) {
            if (typeof titulo !== "string" || !titulo.trim()) {
                return res.status(400).json({
                    erro: "Informe um título válido."
                });
            }

            atualizacao.titulo = titulo.trim();
        }

        if (concluida !== undefined) {
            if (typeof concluida !== "boolean") {
                return res.status(400).json({
                    erro: "O campo concluida deve ser booleano."
                });
            }

            atualizacao.concluida = concluida;
        }

        if (Object.keys(atualizacao).length === 0) {
            return res.status(400).json({
                erro: "Informe os dados que deseja atualizar."
            });
        }

        const { data, error } = await supabase
            .from("tarefas")
            .update(atualizacao)
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                erro: "Tarefa não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Tarefa atualizada com sucesso!",
            tarefa: data
        });

    } catch (error) {
        console.error("Erro ao atualizar:", error.message);

        return res.status(500).json({
            erro: "Não foi possível atualizar a tarefa."
        });
    }
});

// ==========================================
// DELETE - EXCLUIR TAREFA
// ==========================================

app.delete("/api/tarefas/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("tarefas")
            .delete()
            .eq("id", id)
            .select("id")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                erro: "Tarefa não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Tarefa excluída com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao excluir:", error.message);

        return res.status(500).json({
            erro: "Não foi possível excluir a tarefa."
        });
    }
});

// ==========================================
// TRATAMENTO DE ROTAS INEXISTENTES
// ==========================================

app.use((req, res) => {
    return res.status(404).json({
        erro: "Rota não encontrada."
    });
});

// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

app.use((err, req, res, next) => {
    console.error("Erro interno:", err.message);

    return res.status(500).json({
        erro: "Erro interno do servidor."
    });
});

// ==========================================
// EXPORTAÇÃO PARA VERCEL
// ==========================================

module.exports = app;

// ==========================================
// EXECUÇÃO LOCAL
// ==========================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
