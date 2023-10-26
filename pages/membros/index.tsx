import { useEffect, useState } from "react";
import Layout from "../../components/layout";
import { usarContexto } from "../../contexto";
import { Breadcrumb, Form, Table } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import Tooltip from "../../components/tooltip";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;


function nomeFuncao(relatores: Membro[]){
    if(relatores.length === 1)
        return relatores[0].funcao.toLowerCase();
    
    const mulheres = relatores.every(r => r.funcao === "RELATORA");
    return mulheres ? 'Relatoras' :  'Relatores';
}

function Membros(){
    const [comites, setComites] = useState<Comite[]>();
    const [membros, setMembros] = useState<Membro[]>();
    const [filtro, setFiltro] = useState<number>();

    const { api, usuario } = usarContexto();

    async function carregar(){
        try{
            const { data : comites } = await api.get<Comite[]>('/api/comite');
            setComites(comites)

            setFiltro(comites[0].committee_id);

            const { data : membros } = await api.get<Membro[]>('/api/membro');
            setMembros(membros)

        }catch(err){
            // Apenas notifica o usuário que ocorreu um erro.
            // A página será montada com as outras informações, mas certamente não será funcional.
        }
    }

    useEffect(()=>{
        carregar();
    }, [])


    if(!membros)
        return <></>

    const membro_filtrado = membros.filter(m => m.comite === filtro);

    const presidente = membro_filtrado.find(m => m.funcao === "PRESIDENTE" || m.funcao === "PRESIDENTA");
    const relatores = membro_filtrado.filter(m => m.funcao === "RELATOR" || m.funcao === "RELATORA");
    const especialistas = membro_filtrado.filter(m => m.funcao === "ESPECIALISTA");
    const juristas = membro_filtrado.filter(m => m.funcao === "JURISTA");

    const membros_comuns = membro_filtrado.filter(m => m.funcao === "MEMBRO");

    
    function gerarPdf(){
        const pdf = pdfMake.createPdf({
            pageMargins: [10+20, 30],
            header: {
                text: '',
                alignment: 'center',
                margin: 10
            },
            footer: (currentPage, pageCount) => ({
                text: currentPage + '/' + pageCount,
                alignment: 'center' 
            }),
            content: [
                { 
                    marginBottom: 20,
                    columns: [
                        [ 
                            {text: presidente.nome, alignment: "center", bold: true},
                            {text: "Presidente", alignment: "center"},
                        ],
                        [ 
                            {text: relatores.nome, alignment: "center", bold: true},
                            {text: "Relator", alignment: "center"},
                        ],
                    ]
                },
                {
                    text: `${membros_comuns.length} membros`,
                    style: {bold: true}
                },
                {
                    layout: {
                        fillColor: (rowIndex, node,columnIndex )=>  (rowIndex % 2 === 0) ? '#dee2e6' : null ,
                        hLineColor: "#bbb",
                        vLineColor: "#bbb",
                    },
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            /*[ 
                                { text: 'Nome', style: 'header' } , 
                            ],*/
                            ...membros_comuns.map(m => (
                                [ m.nome ]
                            ))
                        ]
                    },
                    style: "table"
                }
            ],
            styles: {
                table: {
                    margin: [0, 10],
                },
                header: {
                    bold: true
                }
            }
        });

        pdf.open();
    }


    return <Layout>
        <div className='d-flex align-items-start justify-content-between'>
            <Breadcrumb>
                <Breadcrumb.Item active>Membros</Breadcrumb.Item>
            </Breadcrumb>


            {comites?.length > 1 && usuario.permissoes.estatistica &&
                <Form.Select size="sm" value={filtro} style={{width: '40%'}} onChange={(e)=> setFiltro(parseInt(e.target.value))}>
                    {comites?.map( (c, i) => <option key={c.committee_id} value={c.committee_id}>{i + 1}. {c.committee_name}</option>)}
                </Form.Select>
            }
        </div>
        
        {/*
        <Tooltip mensagem="Gerar PDF">
            <FontAwesomeIcon onClick={gerarPdf} className="btn m-2 p-0" icon={faDownload} fontSize={18}/>
        </Tooltip>
        */}

        <div className="container row text-center">
            <div className="col-lg-6 col-12 mt-5">
                <h6>{presidente.nome}</h6>
                <div style={{textTransform:"capitalize"}}>{presidente.funcao.toLowerCase()}</div>
            </div>        

            <div className="col-lg-6 col-12 mt-5">
                {relatores.map(r => <h6 key={r.id}>{r.nome}</h6>)}
                <div style={{textTransform:"capitalize"}}>
                    {nomeFuncao(relatores)}
                </div>
            </div>    

            <div className="col-lg-6 col-12 mt-5">
                {especialistas.map(r => <h6 key={r.id}>{r.nome}</h6>)}
                <div>{especialistas.length === 1 ? 'Especialista' : 'Especialistas'}</div>
            </div>    

            <div className="col-lg-6 col-12 mt-5">
                {juristas.map(r => <h6 key={r.id}>{r.nome}</h6>)}
                <div>{juristas.length === 1 ? 'Jurista' : 'Juristas'}</div>
            </div>        
        </div>
        
        <h6 className="mt-4 mb-2">{membros_comuns.length} membros</h6>
        <Table striped>
            <thead>
                <tr>
                </tr>
            </thead>
            <tbody>
                {membros_comuns?.map(m => <tr key={m.id}>
                    <td>{m.nome}</td>
                </tr>)
                }
            </tbody>
        </Table>
    </Layout>
}

export default Membros;