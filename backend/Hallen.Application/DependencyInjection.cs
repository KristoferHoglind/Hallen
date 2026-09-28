using Hallen.Application.GameMatches;
using Hallen.Application.GameSessions;
using Hallen.Application.GameSessionSetup;
using Hallen.Application.GameTeams;
using Hallen.Application.Players;
using Hallen.Application.SportsGroupMembers;
using Hallen.Application.SportsGroups;
using Microsoft.Extensions.DependencyInjection;

namespace Hallen.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddHallenApplication(this IServiceCollection services)
    {
        services.AddScoped<IPlayerService, PlayerService>();
        services.AddScoped<ISportsGroupService, SportsGroupService>();
        services.AddScoped<IGameSessionService, GameSessionService>();
        services.AddScoped<IGameSessionSetupService, GameSessionSetupService>();
        services.AddScoped<IGameMatchService, GameMatchService>();
        services.AddScoped<IGameTeamService, GameTeamService>();
        services.AddScoped<ISportsGroupAuthorizationService, SportsGroupAuthorizationService>();
        services.AddScoped<ISportsGroupMemberService, SportsGroupMemberService>();

        return services;
    }
}