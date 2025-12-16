"use client"

import React, {useState} from "react";

type Data = {
    email: string,
    password: string,
}

export default function page() {
    const obj = {
        email: "",
        password: "",
    }
    const [data, setData] = useState<Data>(obj);
    const [error, setError] = useState<null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        setData(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await fetch(process.env.api + "/auth/signin", {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
            credentials: "include"
        });
        const json = await res.json();

        if (json.status !== 200) {
            setData(obj);
            setError(json.message);
            return;
        }

        sessionStorage.setItem("token", "Bearer " + json.token);

        setError(null);
        setData(obj);
    }

    return (
        <div className="flex items-center justify-center w-full mt-32">
            <div
                className="flex flex-col gap-4 p-6 mt-4 bg-[#ddd]/10 rounded-md shadow-md h-auto w-2/5 mx-auto">
                <h1 className="select-none text-black/90 font-extrabold text-xl sm:text-2xl opacity-75 mt-6 text-center">
                    Admin Sign In
                </h1>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-6">
                        <label className="select-none block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email <span className="text-red-500">*</span>
                        </label>

                        <input className="appearance-none border border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight outline-none"
                               id="email"
                               type="email"
                               value={data.email}
                               onChange={handleChange}
                               placeholder="yusu@duck.com"
                               autoComplete="off"
                               name="email"/>
                    </div>

                    <div className="mb-6">
                        <label className="select-none block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password <span className="text-red-500">*</span>
                        </label>

                        <input className="appearance-none border border-gray-200 rounded w-full py-2 px-3 text-gray-700 leading-tight outline-none"
                               id="password"
                               type="password"
                               value={data.password}
                               onChange={handleChange}
                               placeholder="***********"
                               autoComplete="off"
                               name="password"/>
                    </div>

                    <div className="mb-6 flex items-center">
                        <span className="select-none text-gray-700 text-xs mt-[0.7px] font-bold">
                            <span className="text-red-500">*</span> Required fields
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            disabled={!data.email || !data.password}
                            className="cursor-pointer outline-none w-full transition duration-200 ease-in bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                        >
                            Sign In
                        </button>
                    </div>
                </form>

                {error && <div className="bg-gray-300/30 p-2 rounded-md">
                    <span className="ml-2 text-red-700">{error}</span>
                </div>}
            </div>
        </div>
    )
}
