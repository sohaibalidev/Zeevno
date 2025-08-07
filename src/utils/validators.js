exports.validateEmail = (email) => {
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "protonmail.com"];
    const re = /^[\w.%+-]+@([\w.-]+\.[a-z]{2,})$/i;
    const match = email.match(re);
    return !!match && domains.includes(match[1].toLowerCase());
}

exports.validatePhone = (phone) => {
    const re = /^(\+92\s?|0)?3[0-9]{2}[-\s]?[0-9]{7}$/;
    return re.test(phone);
}

exports.validateProductId = (id) => {
    if (!id) return false;
    const trimmed = id.toString().trim();
    return trimmed !== '' && !isNaN(trimmed) && trimmed.length === 6;
};
