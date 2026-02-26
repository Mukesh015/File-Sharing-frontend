const formatTime = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default formatTime;