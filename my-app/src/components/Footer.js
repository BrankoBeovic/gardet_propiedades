
import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">Gardet Propiedades</h3>
                        <p className="text-sm text-gray-400">© 2024 Gardet Propiedades. Todos los derechos reservados.</p>
                    </div>
                    <div className="flex space-x-4">
                        {/* Add social links here if needed */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
