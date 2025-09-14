// utils/formatAiResponse.ts
export const formatAiResponse = (text: string): string => {
    // Replace **bold** with <strong> tags and add line breaks
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*/g, '•') // Convert asterisks to bullet points
        .replace(/\n/g, '<br/>') // Preserve line breaks
        .replace(/\*\s+(.*?):/g, '<br/><strong>$1:</strong>') // Section headers with asterisks
        .replace(/(\d+\.\s+.*?):/g, '<br/><strong>$1:</strong>') // Numbered sections
        .replace(/•\s+(.*?)(?=•|$)/g, '<br/>• $1'); // Bullet points

    // Add proper spacing for lists
    formattedText = formattedText.replace(/(<br\/>•)/g, '<br/>&nbsp;&nbsp;•');

    return formattedText;
};