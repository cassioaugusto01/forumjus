import React, { useEffect, useState } from "react";
import Layout from "../../components/layout";
import comPermissao from "../../utils/com-permissao";
import * as Ato from './ato';
import { usarContexto } from "../../contexto";
import { Breadcrumb, Button, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faFileCircleCheck } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "../../components/tooltip";

const ADMITIDOS = 0;

function AtoOcorrencia(){
    const [comites, setComites] = useState<Comite[]>();
    
    const {api} = usarContexto();

    async function carregar(){
        const { data : comites } = await api.get<Comite[]>('/api/comite');
        setComites(comites)
    }

    async function criarPDF(comite: number){
        const {data: inscricoes} = await api.get<Inscricao[]>(`/api/caderno?nivel=${ADMITIDOS}&comissao=${comite}`)
        const { data : membros } = await api.get<Membro[]>('/api/membro');
        
        Ato.criarPDF({
            membros: membros.filter(m => m.comite === comite),
            inscricoes,
            comites
        })
    }

    useEffect(()=>{
        carregar();
    }, []);

    return <Layout >
        <div className='d-flex align-items-start justify-content-between'>
            <Breadcrumb>
                <Breadcrumb.Item active>Ato</Breadcrumb.Item>
            </Breadcrumb>
        </div>

        <Table hover={true}>
            <thead>
                <tr>
                    <th>Comissão</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {comites?.map( c => <tr key={c.committee_id}>
                    <td>{c.committee_name}</td>
                    <td className='text-center' >
                        <Tooltip mensagem='Criar .pdf do ato' posicao='bottom'>
                            <FontAwesomeIcon 
                                onClick={() => criarPDF( c.committee_id)}
                                color='#009' 
                                style={{cursor: 'pointer', marginRight: 10}} 
                                icon={faFile} 
                            />
                        </Tooltip>
                    </td>
                </tr>)}
            </tbody>
        </Table>
    </Layout>
}

export default comPermissao(AtoOcorrencia, "ASSESSORIA", "PROGRAMADOR") ;