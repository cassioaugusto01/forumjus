import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout';
import Comite from './comite';
import { Breadcrumb } from 'react-bootstrap';
import { usarContexto } from '../../contexto';

function Votacao(){
    const [comites, setComites] = useState<Comite[]>();
    const {exibirNotificacao, api} = usarContexto();

    useEffect(()=>{
        api.get('/api/votacao')
        .then(({data}) => setComites(data))
        .catch(err => exibirNotificacao({texto: 'Votação', titulo: 'Não foi possível carregar os enunciados.'}));
    }, [])

    return <Layout>
        <Breadcrumb>
            <Breadcrumb.Item href='/votacao' active={true}>Votação</Breadcrumb.Item>
        </Breadcrumb>

        <div className='d-flex row'>
            {comites?.map( c => <Comite key={c.committee_id} comite={c} />) }
        </div>
    </Layout>
}

export default Votacao;