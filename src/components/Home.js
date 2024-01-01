import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addHours, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { MdCheckCircle, MdCancel, MdAddCircle, MdDeleteOutline, MdModeEditOutline, MdAddAPhoto } from 'react-icons/md';
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import isValidDate from 'date-fns/isValid';
import { maskPhone, maskPersonalRegister, maskZipCode} from './MaskFunctions';

import config from '../Config.js';

const pathApiUrl = config.pathApiUrl;


const Home = React.memo(() => {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [showFormModal, setShowFormModal] = useState(false);
    
    const [newChild, setNewChild] = useState(null);
    const [editChild, setEditChild] = useState(null);
    const [showDeleteModal, setDeleteShowModal] = useState(false);
    const [childToDelete, setChildToDelete] = useState(null);
    const [childToDeleteName, setChildToDeleteName] = useState(null);
    const [error, setError] = useState(null);
    const [buttonEnabled, setButtonEnabled] = useState(false);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedChildForPhoto, setSelectedChildForPhoto] = useState(null);
    const [tempSelectedFile, setTempSelectedFile] = useState(null);
    const [defaultPhotoBase64, setDefaultPhotoBase64] = useState(null);
    const [childPhotos, setChildPhotos] = useState({});
    const [photoLoading, setPhotoLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isMouseOver, setIsMouseOver] = useState(false);

    const handleImageLoad = () => { setImageLoaded(true); };

    const checkAuthentication = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
        navigate("/login");
        } else {
            console.log("Token válido: ", token);
            try {
                const decodedToken = jwtDecode(token);
                const userRole = decodedToken.role;
                console.log("Papel do usuário: ", userRole);
                setButtonEnabled(userRole === "admin");
            } catch (error) {
                console.error("Erro ao decodificar o token: ", error);
            }
        }
    };
    
    const fetchChildrenData = async () => {
        try {
            const response = await axios.get(`${pathApiUrl}/childrens`);
            setChildren(response.data.children);

            const updatedChildPhotos = { ...childPhotos };
            
            for (const child of response.data.children) {
                setPhotoLoading((prevPhotoLoading) => ({ ...prevPhotoLoading, [child._id]: true }));

                const photoResponse = await axios.get(`${pathApiUrl}/photo/details/${child.photograph}`);
                updatedChildPhotos[child._id] = photoResponse.data;

                setPhotoLoading((prevPhotoLoading) => ({ ...prevPhotoLoading, [child._id]: false }));
            }

            setChildPhotos(updatedChildPhotos);

        } catch (error) {
            console.error("Erro ao buscar dados das crianças: ", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                checkAuthentication();
                await fetchChildrenData();
                setError(null);
            } catch (error) {
                if (error.response && error.response.status === 422) {
                    setError(error.response.data.msg);
                } else {
                    console.error("Erro ao buscar dados das crianças: ", error);
                }
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (error) {
            toast.warn(error);
        }
    }, [error]);

    const handleShowFormModal = () => {
        setNewChild({
            name: '',
            birthDate: '',
            sex: 'M',
            personalDocument: '',
            maskPhone: '',

        });
        setShowFormModal(true);
    }
    const handleCloseFormModal = () => {
        setShowFormModal(false);
        setEditChild(null);
    };
    const handleShowDeleteModal = (childId, childName) => {
        setChildToDelete(childId);
        setChildToDeleteName(childName);
        setDeleteShowModal(true);

    };
    const handleCloseDeleteModal = () => {
        setDeleteShowModal(false);
    }
    const handleEditChild = async (childId) => {
        try {
            const response = await axios.get(`${pathApiUrl}/child/${childId}`);
            setEditChild(response.data.child);
            setNewChild(null);
            setShowFormModal(true);
        } catch (error) {
            console.error("Erro ao buscar dados da criança: ", error);
        }
    };

    const handleDeleteChild = async () => {
        try {
            if (childToDelete) {
                await axios.delete(`${pathApiUrl}/delete/${childToDelete}`);
                fetchChildrenData();
                handleCloseDeleteModal();
                setChildToDelete(null);
            }
        } catch (error) {
            console.error("Erro ao excluir a criança: ", error);
        }
    };

    const handleSaveChild = async () => {
        try {
                if (editChild) {
                    if (editChild._id) {
                        console.log("Edição do id: " + editChild._id)
                        await axios.put(`${pathApiUrl}/child/update/${editChild._id}`, editChild);
                        fetchChildrenData();
                        handleCloseFormModal();
                    }
                }
                
                if (newChild !== null){
                    console.log("Novo child: " + newChild.name)

                    if (!newChild.photograph) {
                        newChild.photograph = 'default';
                    }

                    await axios.post(`${pathApiUrl}/child/register`, newChild);
                    fetchChildrenData();
                    handleCloseFormModal();
                }

        } catch (error) {
            if (error.response && error.response.status !== 200) {
                setError(error.response.data.msg);
            } else {
                console.error("Erro ao salvar dados da criança: ", error);
            };
        }
    };

    const handleImageClick = (child) => {
        console.log(child)
        setSelectedChildForPhoto(({
            _id: child._id,
            name: child.name,
        }));
        document.getElementById(`photoFileInput_${child._id}`).click();
      };
      
    const handleFileInputChange = (event) => {
        event.preventDefault();

        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFile(reader.result);
                console.log('@@@@@@@@inseriu ', file)
                setTempSelectedFile(file);
                setShowPhotoModal(true);
            };
        
            reader.readAsDataURL(file);
        }
    };
    
    const handleConfirmSavePhoto = async () => {
        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', tempSelectedFile);
                formData.append('childId', selectedChildForPhoto._id);
      
                await axios.post(
                    `${pathApiUrl}/photo/${selectedChildForPhoto._id}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    }
                );

                fetchChildrenData();

                setTempSelectedFile(null);
                setSelectedChildForPhoto(null);
                setSelectedFile(null);
                setShowPhotoModal(false);
            }
        } catch (error) {
          console.error('Erro ao fazer upload da foto:', error);
        }
    };

      
    return(

        <div>
            <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            />

            {selectedChildForPhoto && (
                <Modal isOpen={showPhotoModal} toggle={() => setShowPhotoModal(false)} size="lg">
                <ModalHeader toggle={() => setShowPhotoModal(false)}>Visualizar Foto</ModalHeader>
                <ModalBody>
                    Deseja usar a foto abaixo na crian&ccedil;a <strong>{selectedChildForPhoto.name}</strong>?
                    <br/>
                    <img
                    src={tempSelectedFile ? URL.createObjectURL(tempSelectedFile) : selectedFile}
                    alt="Foto"
                    className="photo-container"
                    style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowPhotoModal(false)}>
                    Cancelar
                    </Button>
                    <Button color="primary" onClick={handleConfirmSavePhoto}>
                    Salvar
                    </Button>
                </ModalFooter>
                </Modal>
            )}

            <Modal isOpen={showDeleteModal} toggle={handleCloseDeleteModal}>
              <ModalHeader toggle={handleCloseDeleteModal}>Exclusão</ModalHeader>
              <ModalBody>Tem certeza que deseja excluir a crian&ccedil;a <strong>{childToDeleteName}</strong>?</ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={handleCloseDeleteModal}>
                    <MdCancel style={{marginBottom:'3px'}}/> Cancelar
                </Button>
                <Button color="primary" onClick={() => handleDeleteChild()}>
                    <MdCheckCircle style={{marginBottom:'3px'}}/> Confirmar
                </Button>
              </ModalFooter>
            </Modal>

            <Modal isOpen={showFormModal} toggle={handleCloseFormModal} size="xl" backdrop="static">
            <ModalHeader toggle={handleCloseFormModal}> {editChild ? `Edição de Registro` : `Novo Registro` }</ModalHeader>
            <ModalBody>
                <form>
                    <div className="form-group">
                        {editChild ? 
                            <input type="text" hidden className="form-control" readOnly id="id" value={editChild._id}/> 
                        :
                            ''
                        }
                        <div className="row" style={{background:'#e0e0e0', minHeight:'80px'}}>
                            <div className="col-md-3">
                                <label for="recipient-name" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Nome:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="name" style={{height:'35px'}} maxlength="45"
                                        defaultValue={editChild.name}
                                        onChange={(e) => {setEditChild({ ...editChild, name: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="name" style={{height:'35px'}} maxlength="45"
                                        onChange={(e) => {setNewChild({ ...newChild, name: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-birthDate" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Data Nascimento:</label>
                                {editChild ?
                                    <input type="date" className="form-control" id="birthDate" style={{height:'35px'}} 
                                        value={new Date(editChild.birthDate)?.toISOString()?.split('T')[0]}
                                        onChange={(e) => isValidDate(new Date(e.target.value)) ? setEditChild({ ...editChild, birthDate: e.target.value }) : null}
                                    />
                                :
                                    <input type="date" className="form-control" id="birthDate" style={{height:'35px'}}
                                        onChange={(e) => isValidDate(new Date(e.target.value)) ? setNewChild({ ...newChild, birthDate: e.target.value }) : null}
                                    />
                                }
                            </div>
                            <div className="col-md-1">
                                <label for="recipient-sex" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Sexo:</label>
                                {editChild ?
                                    <select className="form-select form-select-sm" id="sex" style={{height:'35px'}}
                                        onChange={(e) => {setEditChild({ ...editChild, sex: e.target.value });}}>
                                        <option value="M" selected={editChild.sex === 'M' ? 'selected' : ''}>M</option>
                                        <option value="F" selected={editChild.sex === 'F' ? 'selected' : ''}>F</option>
                                    </select>
                                :
                                    <select className="form-select form-select-sm" id="sex" style={{height:'35px'}}
                                        onChange={(e) => {setNewChild({ ...newChild, sex: e.target.value });}}>
                                        <option value="M">M</option>
                                        <option value="F">F</option>
                                    </select>
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-personalDocument" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Cpf:</label>
                                {editChild ?
                                    <input type="text" className="form-control" id="personalDocument" style={{height:'35px'}} maxlength="14"
                                        value={editChild.personalDocument || ''}
                                        onChange={(e) => {setEditChild({ ...editChild, personalDocument: maskPersonalRegister(e.target.value)});}}
                                    />
                                :
                                    <input type="text" className="form-control" id="personalDocument" style={{ height: '35px' }} maxLength="14"
                                        value={newChild?.personalDocument  || ''}
                                        onChange={(e) => {setNewChild({ ...newChild, personalDocument: maskPersonalRegister(e.target.value) });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-classChild" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Classe:</label>
                                {editChild ?
                                    <input type="text" className="form-control" id="classChild" style={{height:'35px'}} maxlength="12"
                                        defaultValue={editChild.classChild}
                                        onChange={(e) => {setEditChild({ ...editChild, classChild: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="classChild" style={{height:'35px'}} maxlength="12"
                                        onChange={(e) => {setNewChild({ ...newChild, classChild: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-telephone" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Telefone:</label>
                                {editChild ?
                                    <input type="text" className="form-control" id="telephone" style={{height:'35px'}} maxLength="15"
                                        value={editChild.telephone || ''}
                                        onChange={(e) => {setEditChild({ ...editChild, telephone: maskPhone(e.target.value)});}}
                                    />
                                :
                                    <input type="text" className="form-control" id="telephone" style={{height:'35px'}} maxLength="15"
                                        value={newChild?.telephone || ''}
                                        onChange={(e) => {setNewChild({ ...newChild, telephone: maskPhone(e.target.value)});}}
                                    />
                                }
                            </div>
                        </div>
                        <div className="row"  style={{background:'#e6e6e6', minHeight:'80px'}}>
                            <div className="col-md-6">
                                <label for="recipient-address" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Logradouro:</label>
                                {editChild ?
                                    <input type="text" className="form-control" id="address" style={{height:'35px'}} maxLength="45"
                                        defaultValue={editChild.address}
                                        onChange={(e) => {setEditChild({ ...editChild, address: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="address" style={{height:'35px'}} maxLength="45"
                                        onChange={(e) => {setNewChild({ ...newChild, address: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-1">
                                <label for="recipient-addressNumber" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>N&deg;:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="addressNumber" style={{height:'35px'}} maxLength="4"
                                        defaultValue={editChild.addressNumber}
                                        onChange={(e) => {setEditChild({ ...editChild, addressNumber: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="addressNumber" style={{height:'35px'}} maxLength="4"
                                        onChange={(e) => {setNewChild({ ...newChild, addressNumber: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-5">
                                <label for="recipient-addressComplement" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Complemento:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="addressComplement" style={{height:'35px'}} maxLength="35"
                                        defaultValue={editChild.addressComplement}
                                        onChange={(e) => {setEditChild({ ...editChild, addressComplement: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="addressComplement" style={{height:'35px'}} maxLength="35"
                                        onChange={(e) => {setNewChild({ ...newChild, addressComplement: e.target.value });}}
                                    />
                                }
                            </div>
                        </div>
                        <div className="row" style={{background:'#e0e0e0', minHeight:'80px'}}>
                            <div className="col-md-5">
                                <label for="recipient-addressNeighborhood" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Bairro:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="addressNeighborhood" style={{height:'35px'}} maxLength="40"
                                        defaultValue={editChild.addressNeighborhood}
                                        onChange={(e) => {setEditChild({ ...editChild, addressNeighborhood: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="addressNeighborhood" style={{height:'35px'}} maxLength="40"
                                        onChange={(e) => {setNewChild({ ...newChild, addressNeighborhood: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-4">
                                <label for="recipient-addressMunicipality" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Munic&iacute;pio:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="addressMunicipality" style={{height:'35px'}} maxLength="40"
                                        defaultValue={editChild.addressMunicipality}
                                        onChange={(e) => {setEditChild({ ...editChild, addressMunicipality: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="addressMunicipality" style={{height:'35px'}} maxLength="40"
                                        onChange={(e) => {setNewChild({ ...newChild, addressMunicipality: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-addressZip" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Cep:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="addressZip" style={{height:'35px'}} maxLength="9"
                                        value={editChild.addressZip || ''}
                                        onChange={(e) => {setEditChild({ ...editChild, addressZip: maskZipCode(e.target.value)});}}
                                    />
                                :
                                    <input type="text" className="form-control" id="addressZip" style={{height:'35px'}} maxLength="9"
                                        value={newChild?.addressZip || ''}
                                        onChange={(e) => {setNewChild({ ...newChild, addressZip: maskZipCode(e.target.value)});}}
                                    />
                                }
                            </div>
                            <div className="col-md-1">
                                <label for="recipient-addressUF" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>UF:</label>
                                {editChild ? 
                                    <select className="form-select form-select-sm" id="addressUF" style={{height:'35px'}} onChange={(e) => {setEditChild({ ...editChild, addressUF: e.target.value });}}>
                                        <option value="AC" selected={editChild.addressUF === 'AC' ? 'selected' : ''}>AC</option>
                                        <option value="AL" selected={editChild.addressUF === 'AL' ? 'selected' : ''}>AL</option>
                                        <option value="AP" selected={editChild.addressUF === 'AP' ? 'selected' : ''}>AP</option>
                                        <option value="AM" selected={editChild.addressUF === 'AM' ? 'selected' : ''}>AM</option>
                                        <option value="BA" selected={editChild.addressUF === 'BA' ? 'selected' : ''}>BA</option>
                                        <option value="CE" selected={editChild.addressUF === 'CE' ? 'selected' : ''}>CE</option>
                                        <option value="DF" selected={editChild.addressUF === 'DF' ? 'selected' : ''}>DF</option>
                                        <option value="ES" selected={editChild.addressUF === 'ES' ? 'selected' : ''}>ES</option>
                                        <option value="GO" selected={editChild.addressUF === 'GO' ? 'selected' : ''}>GO</option>
                                        <option value="MA" selected={editChild.addressUF === 'MA' ? 'selected' : ''}>MA</option>
                                        <option value="MT" selected={editChild.addressUF === 'MT' ? 'selected' : ''}>MT</option>
                                        <option value="MS" selected={editChild.addressUF === 'MS' ? 'selected' : ''}>MS</option>
                                        <option value="MG" selected={editChild.addressUF === 'MG' ? 'selected' : ''}>MG</option>
                                        <option value="PA" selected={editChild.addressUF === 'PA' ? 'selected' : ''}>PA</option>
                                        <option value="PB" selected={editChild.addressUF === 'PB' ? 'selected' : ''}>PB</option>
                                        <option value="PR" selected={editChild.addressUF === 'PR' ? 'selected' : ''}>PR</option>
                                        <option value="PE" selected={editChild.addressUF === 'PE' ? 'selected' : ''}>PE</option>
                                        <option value="PI" selected={editChild.addressUF === 'PI' ? 'selected' : ''}>PI</option>
                                        <option value="RJ" selected={editChild.addressUF === 'RJ' ? 'selected' : ''}>RJ</option>
                                        <option value="RN" selected={editChild.addressUF === 'RN' ? 'selected' : ''}>RN</option>
                                        <option value="RS" selected={editChild.addressUF === 'RS' ? 'selected' : ''}>RS</option>
                                        <option value="RO" selected={editChild.addressUF === 'RO' ? 'selected' : ''}>RO</option>
                                        <option value="RR" selected={editChild.addressUF === 'RR' ? 'selected' : ''}>RR</option>
                                        <option value="SC" selected={editChild.addressUF === 'SC' ? 'selected' : ''}>SC</option>
                                        <option value="SE" selected={editChild.addressUF === 'SE' ? 'selected' : ''}>SE</option>
                                        <option value="SP" selected={editChild.addressUF === 'SP' ? 'selected' : ''}>SC</option>
                                        <option value="TO" selected={editChild.addressUF === 'TO' ? 'selected' : ''}>TO</option>
                                    </select>
                                    :
                                    <select className="form-select form-select-sm" id="addressUF" style={{height:'35px'}} onChange={(e) => {setNewChild({ ...newChild, addressUF: e.target.value });}}>
                                        <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option><option value="AM">AM</option>
                                        <option value="BA">BA</option><option value="CE">CE</option><option value="DF">DF</option><option value="ES">ES</option>
                                        <option value="GO">GO</option><option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                                        <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option><option value="PR">PR</option>
                                        <option value="PE">PE</option><option value="PI">PI</option><option value="RJ">RJ</option><option value="RN">RN</option>
                                        <option value="RS">RS</option><option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                                        <option value="SE">SE</option><option value="SP">SC</option><option value="TO">TO</option>
                                    </select>
                                }
                            </div>
                        </div>
                        <div className="row" style={{background:'#e6e6e6', minHeight:'80px'}}>
                            <div className="col-md-3">
                                <label for="recipient-responsible1" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Respons&aacute;vel 1:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="responsible1" style={{height:'35px'}} maxlength="45"
                                        defaultValue={editChild.responsible1}
                                        onChange={(e) => {setEditChild({ ...editChild, responsible1: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="responsible1" style={{height:'35px'}} maxlength="45"
                                        onChange={(e) => {setNewChild({ ...newChild, responsible1: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-3">
                                <label for="recipient-parentageResponsible1" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Parentesco Respons&aacute;vel 1:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="parentageResponsible1" style={{height:'35px'}} maxlength="20"
                                        defaultValue={editChild.parentageResponsible1}
                                        onChange={(e) => {setEditChild({ ...editChild, parentageResponsible1: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="parentageResponsible1" style={{height:'35px'}} maxlength="20"
                                        onChange={(e) => {setNewChild({ ...newChild, parentageResponsible1: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-telephoneResponsible1" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Fone Respons&aacute;vel 1:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="telephoneResponsible1" style={{height:'35px'}} maxLength="15"
                                        value={editChild.telephoneResponsible1 || ''}
                                        onChange={(e) => {setEditChild({ ...editChild, telephoneResponsible1: maskPhone(e.target.value)});}}
                                    />
    	                         :
                                    <input type="text" className="form-control" id="telephone" style={{height:'35px'}} maxLength="15"
                                        value={newChild?.telephoneResponsible1 || ''}
                                        onChange={(e) => {setNewChild({ ...newChild, telephoneResponsible1: maskPhone(e.target.value)});}}
                                    />
                                }                                    
                            </div>
                        </div>
                        <div className="row" style={{background:'#e0e0e0', minHeight:'80px'}}>
                            <div className="col-md-3">
                                <label for="recipient-responsible2" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Respons&aacute;vel 2:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="responsible2" style={{height:'35px'}} maxlength="45" 
                                        defaultValue={editChild.responsible2}
                                        onChange={(e) => {setEditChild({ ...editChild, responsible2: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="responsible2" style={{height:'35px'}} maxlength="45" 
                                        onChange={(e) => {setNewChild({ ...newChild, responsible2: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-3">
                                <label for="recipient-parentageResponsible2" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Parentesco Respons&aacute;vel 2:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="parentageResponsible2" style={{height:'35px'}} maxlength="20"
                                        defaultValue={editChild.parentageResponsible2}
                                        onChange={(e) => {setEditChild({ ...editChild, parentageResponsible2: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="parentageResponsible2" style={{height:'35px'}} maxlength="20"
                                        onChange={(e) => {setNewChild({ ...newChild, parentageResponsible2: e.target.value });}}
                                    />
                                }
                            </div>
                            <div className="col-md-2">
                                <label for="recipient-telephoneResponsible2" className="col-form-label"  style={{marginBottom:'1px', paddingBottom: '1px'}}>Fone Respons&aacute;vel 2:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="telephoneResponsible2" style={{height:'35px'}} maxLength="15"
                                    value={editChild.telephoneResponsible2 || ''}
                                    onChange={(e) => {setEditChild({ ...editChild, telephoneResponsible2: maskPhone(e.target.value)});}}
                                />
                             :
                                <input type="text" className="form-control" id="telephone" style={{height:'35px'}} maxLength="15"
                                    value={newChild?.telephoneResponsible2 || ''}
                                    onChange={(e) => {setNewChild({ ...newChild, telephoneResponsible2: maskPhone(e.target.value)});}}
                                />
                            }                                    
                            </div>
                        </div>
                        <div className="row" style={{background:'#e6e6e6', minHeight:'80px'}}>
                            <div className="col-md-12">
                                <label for="recipient-photograph" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Foto:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="photograph" style={{height:'35px'}} maxLength="130"
                                        defaultValue={editChild.photograph}
                                        onChange={(e) => {setEditChild({ ...editChild, photograph: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="photograph" style={{height:'35px'}} maxLength="130"
                                        onChange={(e) => {setNewChild({ ...newChild, photograph: e.target.value });}}
                                    />
                                }
                            </div>
                        </div>
                        <div className="row" style={{background:'#e0e0e0', minHeight:'80px'}}>
                            <div className="col-md-12">
                                <label for="recipient-allergenic" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Alerg&ecirc;nico:</label>
                                {editChild ? 
                                    <input type="text" className="form-control" id="allergenic" style={{height:'35px'}} maxLength="130"
                                        defaultValue={editChild.allergenic}
                                        onChange={(e) => {setEditChild({ ...editChild, allergenic: e.target.value });}}
                                    />
                                :
                                    <input type="text" className="form-control" id="allergenic" style={{height:'35px'}} maxLength="130"
                                        onChange={(e) => {setNewChild({ ...newChild, allergenic: e.target.value });}}
                                    />
                                }
                            </div>
                        </div>
                        <div className="row" style={{background:'#e9e9e9', minHeight:'90px'}}>
                            <div className="col-md-12">
                                <label for="recipient-comments" className="col-form-label" style={{marginBottom:'1px', paddingBottom: '1px'}}>Observa&ccedil;&otilde;es:</label>
                                {editChild ? 
                                    <textarea className="form-control" id="comments" defaultValue={editChild.comments} maxLength="300"
                                        onChange={(e) => {setEditChild({ ...editChild, comments: e.target.value });}}>
                                    </textarea>
                                :
                                    <textarea className="form-control" id="comments" maxLength="300"
                                        onChange={(e) => {setNewChild({ ...newChild, comments: e.target.value });}}>
                                    </textarea>
                                }
                            </div>
                        </div>
                    </div>
                </form>
            </ModalBody>
            <ModalFooter style={{background:'#e0e0e0'}}>
                <Button color="secondary" onClick={handleCloseFormModal}>
                    <MdCancel style={{marginBottom:'3px'}}/> Fechar 
                </Button>
                <Button color="primary" onClick={handleSaveChild}>
                    <MdCheckCircle style={{marginBottom:'3px'}}/> Gravar
                </Button>
            </ModalFooter>
            </Modal>

            <div id="div-header" className="container mb-4 bg-secondary" style={{ position: 'fixed', background:'#FFFFFF', top: 0, left: 0, right: 0, zIndex: 1000, 
                                          display:'flex', alignItems:'center', marginTop:'0px', justifyContent:'space-between',
                                       }}>

                <h1 className="h1" style={{color:'#FFF'}}>Creche do N.E.M.L.</h1>
                <div id="div-button-new">
                    <Button color="primary" onClick={handleShowFormModal} style={{marginRight:'32px'}} disabled={!buttonEnabled}>
                        <MdAddCircle style={{marginBottom:'4px'}}/> Novo 
                    </Button>   
                </div>
            </div>
            
            <div className="container-fluid" style={{marginTop:'70px'}}>
                {children.map((child, index) => (
                <div key={child._id} className="container mb-4" style={{background: index % 2 === 0 ? '#e0e0e0' : '#ffffff' }}>
                    <div className="row align-items-center" style={{padding:'10px'}}>
                        <div className="col-md-auto" onClick={buttonEnabled ? () => handleImageClick(child) : null} style={{ cursor: buttonEnabled ? 'pointer' : 'default', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {photoLoading[child._id] ? (
                                <div className="spinner-grow" role="status" style={{ opacity: 0.2 }}>
                                    <span className="sr-only"></span>
                                </div>
                            ) : null}
                                <div style={{ width: '120px'}}>
                                <img
                                    src={`data:image/jpg;base64,${childPhotos[child._id] || defaultPhotoBase64}`}
                                    alt="Foto"
                                    className={`photo-container${!imageLoaded ? ' hidden' : ''}`}
                                    width="120px"
                                    style={{ marginBottom: '3px' }}
                                    onLoad={handleImageLoad}
                                    onMouseOver={() => setIsMouseOver(child._id)}
                                    onMouseOut={() => setIsMouseOver(false)}
                                />
                                </div>
                            <MdAddAPhoto
                                id={child._id}
                                style={{
                                    marginTop: -30,
                                    zIndex: 1,
                                    color: '#FFF',
                                    fontSize: '24px',
                                    opacity: isMouseOver === child._id ? 1 : 0.3,
                                }}
                            />
                            <input type="file" id={`photoFileInput_${child._id}`} style={{ display: 'none'}} onChange={handleFileInputChange} accept="image/*"/>
                        </div>
                        <div className="col-md-10">
                            <div className="row mb-2">
                                <div className="col-md-auto">Nome: <span className="lead" style={{fontSize:'1rem'}}>{child.name}</span></div>
                                <div className="col-md-auto">Data de Nascimento: <span className="lead" style={{fontSize:'1rem'}}>{format(addHours(parseISO(child.birthDate), 3), 'dd/MM/yyyy')}</span></div>
                                <div className="col-md-auto">Sexo: <span className="lead" style={{fontSize:'1rem'}}>{child.sex}</span></div>
                                <div className="col-md-auto">Telefone: <span className="lead" style={{fontSize:'1rem'}}>{child.telephone}</span></div>
                                <div className="col-md-auto">Documento: <span className="lead" style={{fontSize:'1rem'}}>{child.personalDocument}</span></div>
                                <div className="col-md-auto">Classe: <span className="lead" style={{fontSize:'1rem'}}>{child.classChild}</span></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-md-auto">Endere&ccedil;o: <span className="lead" style={{fontSize:'1rem'}}>{child.address}</span></div>
                                <div className="col-md-auto">N&deg; <span className="lead" style={{fontSize:'1rem'}}>{child.addressNumber}</span></div>
                                <div className="col-md-auto">Complemento: <span className="lead" style={{fontSize:'1rem'}}>{child.addressComplement}</span></div>
                                <div className="col-md-auto">Bairro: <span className="lead" style={{fontSize:'1rem'}}>{child.addressNeighborhood}</span></div>
                                <div className="col-md-auto">Munic&iacute;pio: <span className="lead" style={{fontSize:'1rem'}}>{child.addressMunicipality}</span></div>
                                <div className="col-md-auto">Cep: <span className="lead" style={{fontSize:'1rem'}}>{child.addressZip}</span></div>
                                <div className="col-md-auto">UF: <span className="lead" style={{fontSize:'1rem'}}>{child.addressUF}</span></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-md-auto">Respons&aacute;vel 1: <span className="lead" style={{fontSize:'1rem'}}>{child.responsible1}</span></div>
                                <div className="col-md-auto">Parentesco Respons&aacute;vel 1: <span className="lead" style={{fontSize:'1rem'}}>{child.parentageResponsible1}</span></div>
                                <div className="col-md-auto">Telefone Respons&aacute;vel 1: <span className="lead" style={{fontSize:'1rem'}}>{child.telephoneResponsible1}</span></div>
                                <div className="col-md-auto"> Respons&aacute;vel 2: <span className="lead" style={{fontSize:'1rem'}}>{child.responsible2}</span></div>
                                <div className="col-md-auto">Parentesco Respons&aacute;vel 2: <span className="lead" style={{fontSize:'1rem'}}>{child.parentageResponsible2}</span></div>
                                <div className="col-md-auto">Telefone Respons&aacute;vel 2: <span className="lead" style={{fontSize:'1rem'}}>{child.telephoneResponsible2}</span></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-md-auto">Alerg&ecirc;nico: <span className="lead" style={{fontSize:'1rem'}}>{child.allergenic}</span></div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-md-auto">Observa&ccedil;&otilde;es: <span className="lead" style={{fontSize:'1rem'}}>{child.comments}</span></div>
                            </div>
                        </div>
                    </div>


                    <div className="container-fluid" style={{paddingBottom:'1px'}}>
                        <div key={child._id} className="container mb-4">
                            <Button color="success" onClick={() => handleEditChild(child._id)} style={{marginRight:'5px'}} disabled={!buttonEnabled}> 
                                <MdModeEditOutline style={{marginBottom:'4px'}}/> Editar
                            </Button>   

                            <Button color="danger" onClick={() => handleShowDeleteModal(child._id, child.name)} style={{marginLeft:'5px'}} disabled={!buttonEnabled}>
                                <MdDeleteOutline style={{marginBottom:'4px'}}/> Excluir
                            </Button>
                        </div>
                     </div>
                </div>
                ))}
            </div>
        </div>
    );
});

export default Home;