'use client'

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Events, Link as ScrollLink, scrollSpy } from 'react-scroll';

const navigationItems = [
    { name: 'Home', target: 'home' },
    { name: 'Skills', target: 'skills' },
    { name: 'Projects', target: 'projects' },
    { name: 'Contact', target: 'contact' },
];

const Header = () => {
    const [activeSection, setActiveSection] = useState<string>(navigationItems[0]?.target ?? '');

    useEffect(() => {
        Events.scrollEvent.register('begin', function (...args) {
            console.log('begin', args);
        });

        Events.scrollEvent.register('end', function (...args) {
            console.log('end', args);
        });

        scrollSpy.update();

        return () => {
            Events.scrollEvent.remove('begin');
            Events.scrollEvent.remove('end');
        };
    }, []);

    const handleSetActive = (to: string) => {
        setActiveSection(to);
        window.history.pushState(null, '', `#${to}`);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 shadow-md">
            <nav className="container mx-auto px-6 py-3 relative" id="nav">
                <ul className="flex justify-center space-x-8 relative">
                    {navigationItems.map((item) => (
                        <li key={item.target} className="relative w-24 text-center">
                            <ScrollLink
                                to={item.target}
                                smooth={true}
                                duration={500}
                                spy={true}
                                offset={-70} // Adjust this value based on your header height
                                onSetActive={handleSetActive}
                                className="cursor-pointer transition-colors duration-300"
                            >
                                {item.target === activeSection && <Highlight highlightStyle={{ width: '100%', left: 0 }} />}
                                <span className={`transition-colors duration-300 ${item.target === activeSection ? 'text-white' : 'text-gray-700'}`}>
                                    {item.name}
                                </span>
                            </ScrollLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="absolute inset-y-0 left-0 w-[50px] bg-gradient-to-r from-black to-transparent opacity-10"></div>
            <div className="absolute inset-y-0 right-0 w-[50px] bg-gradient-to-l from-black to-transparent opacity-10"></div>
        </header>
    );
};

export default Header;

interface HighlightProps {
    highlightStyle: {
        width: string;
        left: number;
    };
}

const Highlight: React.FC<HighlightProps> = ({ highlightStyle }) => (
    <motion.div
        className="absolute inset-y-0 bg-blue-900 rounded-lg z-[-1]"
        animate={{
            width: highlightStyle.width,
            left: highlightStyle.left,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
);
