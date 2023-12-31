import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from 'reactstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import config from '../Config.js';

const pathApiUrl = config.pathApiUrl;

function Login(){

    const[userName, setUserName] = useState('');
    const[password, setPassword] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log(userName, password)

        try{
            const response = await axios.post(`${pathApiUrl}/auth/login`,
                JSON.stringify(
                    {
                        username: userName,
                        password: password,
                    }
                ),
                {
                    headers: {'Content-Type': 'application/json'}
                }
            );
            localStorage.setItem('token', response.data.token);
            
            navigate("/home");
        }
        catch (error){
            if (error.response) {
                if (error.response.status === 422) {
                    toast.warn('Senha inválida!', { position: "top-center" });
                } else if (error.response.status === 404) {
                    toast.warn('Username não encontrado!', { position: "top-center" });
                } else {
                    toast.error('Erro no servidor', { position: "top-center" });
                }
            } else if (error.request) {
                toast.error('Sem resposta do servidor', { position: "top-center" });
            } else {
                toast.error('Erro durante a requisição', { position: "top-center" });
                console.error(error);
            }
        }
    }

    return(
        <div className="login-form-wrap">
            <h2 color="">Creche N.E.M.L.</h2>
            <form className="login-form">
                <input type="userName"
                    name="userName"
                    placeholder="Username"
                    required
                    onChange={(e) => setUserName(e.target.value)}
                    />
                <input type="password"
                    name="password"
                    placeholder="Password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    />
                <Button color="info"
                        type="submit"
                        className='btn-login'
                        onClick={(e)=> handleLogin(e)}>Login</Button>
            </form>

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

        </div>
    );
}

export default Login;