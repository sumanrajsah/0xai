import React from 'react';
import './toggleSwitch.css';

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    id,
    className = '',
    ...rest
}) => {
    return (
        <label className={`switch ${className}`} htmlFor={id}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                {...rest}
            />
            <span className="slider" />
        </label>
    );
};

export default ToggleSwitch;
