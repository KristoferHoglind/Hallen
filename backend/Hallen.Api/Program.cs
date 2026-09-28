using Hallen.Api.Extensions;
using Hallen.Application;
using Hallen.Database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddHallenApplication();
builder.Services.AddHallenDatabase(builder.Configuration);
builder.Services.AddHallenAuthentication();
builder.Services.AddHallenCors();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseHallenCors();

app.UseAuthentication();
app.UseAuthorization();

await app.SeedDevelopmentDatabaseAsync();

app.MapControllers();

app.Run();