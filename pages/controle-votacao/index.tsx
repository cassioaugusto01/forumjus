import React, {useEffect, useState} from "react";
import { Breadcrumb, Button, Form, Modal } from "react-bootstrap";
import Layout from "../../components/layout";
import { usarContexto } from "../../contexto";
import Enunciado, { formatarCodigo } from "./enunciado";
import comPermissao from "../../utils/com-permissao";
import { retornoAPI } from "../../utils/api-retorno";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

import {EstadoVotacao} from '../../utils/enums';

type EnunciadoVotacao = Enunciado & {
    votacao_inicio: string,
    votacao_fim: string,
}

function ControleVotacao(){
    const [comites, setComites] = useState<Comite[]>();
    const [enunciados, setEnunciados] = useState<EnunciadoVotacao[]>([]);
    const [filtro, setFiltro] = useState<number>(null)
    const [enunciadoGerenciado, setEnunciadoGerenciado] = useState<EnunciadoVotacao>(null);

    const { api, exibirNotificacao } = usarContexto();

    async function carregarComissoes(){
        try{
            const { data : comites } = await api.get<Comite[]>('/api/comite');
            setComites(comites)
        }catch(err){
            // Avise sobre o erro.
            exibirNotificacao({
                titulo: "Nãoo foi possível carregar as comissões.",
                texto: retornoAPI(err),
                tipo: "ERRO"
            })

            // tenta recarregar as comissões.
            setTimeout(carregarComissoes, 1000);
        }
    }

    async function carregar(){
        try{
            const {data} = await api.get<EnunciadoVotacao[]>(`/api/enunciado/votacao`);
            setEnunciados(data);

            const ativo = data.find(e => e.votacao_inicio != null && e.votacao_fim == null);
            console.log(ativo);
            setEnunciadoGerenciado(ativo);
        }catch(err){
             // Avise sobre o erro.
             const texto = retornoAPI(err);

             exibirNotificacao({
                titulo: "Nãoo foi possível carregar os enunciados.",
                texto,
                tipo: "ERRO"
            })

             if(texto !== "Aguarde até a data da votação."){
                // tenta recarregar as comissões.
                setTimeout(carregar, 1000);
             }
                
        }
    }

    async function alterarEstadoVotacao(estadoVotacao: EstadoVotacao){
        try{
            await api.patch('/api/votacao', {
                enunciado: enunciadoGerenciado.statement_id, 
                estadoVotacao
            })

            await carregar();
            exibirNotificacao({ texto: "Votação alterada com sucesso!",})
        }catch(err){
            // Notifica que ocorreu um erro.            
            exibirNotificacao({
                titulo: "Não foi possível processar seu pedido.",
                texto: retornoAPI(err),
                tipo: "ERRO"
            })
        }
    }

    async function pararVotacao(){
        try{
            await api.delete('/api/votacao')
            await carregar();

            exibirNotificacao({
                texto: "Votação encerrada com sucesso!",
            })
        }catch(err){
            // Notifica que ocorreu um erro.            
            exibirNotificacao({
                titulo: "Não foi possível processar seu pedido.",
                texto: retornoAPI(err),
                tipo: "ERRO"
            })
        }
    }

    function gerenciarEnunciado(enunciado: EnunciadoVotacao){
        setEnunciadoGerenciado(enunciado);
    }    

    useEffect(()=>{
        carregar();
        carregarComissoes();
    }, [])


    const codigo = !enunciadoGerenciado ? null : formatarCodigo({
        committee_id: enunciadoGerenciado.committee_id, 
        codigo: enunciadoGerenciado.codigo
    });

    return <Layout>
        <div className='d-flex align-items-start justify-content-between'>
            <Breadcrumb>
                <Breadcrumb.Item active>Controle da votação</Breadcrumb.Item>
            </Breadcrumb>

            <Form.Select size="sm" value={filtro} style={{width: '50%'}} onChange={(e)=> setFiltro(parseInt(e.target.value) || null)}>
                <option value={null}>TODOS</option>
                {comites?.map( (c, i) => <option key={c.committee_id} value={c.committee_id}>{i + 1}. {c.committee_name}</option>)}
            </Form.Select>
        </div>

        <div className='row'>
            {enunciados.filter(e => !e.votacao_fim ).map(e => <Enunciado 
                key={e.statement_id} 
                enunciado={e} 
                filtro={filtro}
                gerenciarEnunciado={gerenciarEnunciado}
            />)}
        </div>

        <Modal show={enunciadoGerenciado != null} onHide={()=> null/* Notificar erro! */}>
            <Modal.Header>Controle da votação <h6>{codigo}</h6></Modal.Header>
            <Modal.Body className="d-flex justify-content-between flex-wrap" style={{gap: 20}}>
                <span>{enunciadoGerenciado?.statement_text}</span>
                <hr className="w-100" />
                <Button className="w-100" onClick={() => alterarEstadoVotacao(EstadoVotacao.APRESENTACAO_ENUNCIADO)}>1. Apresentar enunciado</Button>
                <Button className="w-100" onClick={() => alterarEstadoVotacao(EstadoVotacao.CRONOMETRO_DEFESA)}>2. Iniciar cronômetro</Button>
                <Button className="w-100" onClick={() => alterarEstadoVotacao(EstadoVotacao.VOTACAO)}>3. Iniciar votação</Button>
                <Button className="w-100" onClick={() => pararVotacao()}>4. Parar votação</Button>
            </Modal.Body>
            <Modal.Footer></Modal.Footer>
        </Modal>
    </Layout>
}

export default comPermissao(ControleVotacao, "PRESIDENTE", "PRESIDENTA", "RELATOR", "RELATORA") ;