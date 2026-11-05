namespace Hallen.Common.Privacy;

public static class EmailPrivacy
{
    public static string Mask(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "";
        var separator = email.LastIndexOf('@');
        if (separator <= 0 || separator == email.Length - 1) return "***";
        return $"{email.EnumerateRunes().First()}***{email[separator..]}";
    }
}
