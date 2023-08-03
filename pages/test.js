import React from 'react';
import dynamic from 'next/dynamic'
const PortfolioFilterOne = dynamic(() => import('@/components/portfolio/PortfolioFilterOne'), {
    ssr: false,
})

export default function Test() {
    return (
        <>
            <PortfolioFilterOne />
        </>
    );
};
