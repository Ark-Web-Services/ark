import { useState } from 'react';
import * as Icon from 'react-feather';

export default function QuantityInput() {
    const [value, setValue] = useState(1);

    const handleUpClick = () => {
        setValue(value + 1);
    };

    const handleDownClick = () => {
        setValue(value - 1);
    };

    return (
        <div className="input-counter js-input-counter">
            <input className="input-counter__counter" type="number" placeholder="value..." value={value} onChange={(e) => setValue(e.target.value)} />
            <div className="input-counter__controls">
                <button className="input-counter__down js-down" onClick={handleDownClick}>
                    <Icon.Minus className="icon" />
                </button>
                <button className="input-counter__up js-up" onClick={handleUpClick}>
                    <Icon.Plus className="icon" />
                </button>
            </div>
        </div>
    );
};