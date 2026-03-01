const formatTime = (
    date?: string,
    options?: { hour12?: boolean }
) => {
    if (!date) return "";

    const d = new Date(date);

    // Check for invalid date
    if (isNaN(d.getTime())) return "";

    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: options?.hour12 ?? true, // default 12-hour format
    });
};

export default formatTime;