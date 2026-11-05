namespace Hallen.Application.SportsGroups;

public sealed class GroupCreationDeniedException() : Exception(
    "Du har nått gränsen på 20 skapade grupper eller saknar behörighet att skapa grupper.");
