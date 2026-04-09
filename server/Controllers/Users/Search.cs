using System;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pbl3.Data;
using Pbl3.Dtos;

namespace Pbl3.Controllers
{
    [ApiController]
    [Route("api/landing/provinces/search")]
    public class ProvincesSearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProvincesSearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        private sealed record SearchMatchItem(
            string Type,
            string Name,
            string ProvinceCode,
            string ProvinceName,
            string? DistrictCode,
            string? DistrictName,
            string? WardCode,
            int Score);

        // Function to remove diacritics (Vietnamese accents)
        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();
            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }
            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        // Levenshtein distance for fuzzy search
        private static int LevenshteinDistance(string s, string t)
        {
            if (string.IsNullOrEmpty(s)) return t?.Length ?? 0;
            if (string.IsNullOrEmpty(t)) return s.Length;

            int n = s.Length;
            int m = t.Length;
            int[,] d = new int[n + 1, m + 1];

            for (int i = 0; i <= n; d[i, 0] = i++) ;
            for (int j = 0; j <= m; d[0, j] = j++) ;

            for (int i = 1; i <= n; i++)
            {
                for (int j = 1; j <= m; j++)
                {
                    int cost = (s[i - 1] == t[j - 1]) ? 0 : 1;
                    d[i, j] = Math.Min(
                        Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                        d[i - 1, j - 1] + cost
                    );
                }
            }

            return d[n, m];
        }

        // GET /api/landing/provinces/search?query=hoà khánh lien chieu da nang
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> Search([FromQuery(Name = "query")] string? query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Query is required." });

            var normalizationCache = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            string NormalizeText(string text)
            {
                if (string.IsNullOrWhiteSpace(text))
                    return string.Empty;

                if (normalizationCache.TryGetValue(text, out var cached))
                    return cached;

                var normalized = RemoveDiacritics(text).ToLowerInvariant();
                normalizationCache[text] = normalized;
                return normalized;
            }

            string trimmedQuery = query.Trim();
            string normalizedQuery = NormalizeText(trimmedQuery);
            string[] queryWords = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            int CalculatePhraseScore(string? value)
            {
                if (string.IsNullOrWhiteSpace(value))
                    return 0;

                string normalizedValue = NormalizeText(value);

                if (normalizedValue.Equals(normalizedQuery, StringComparison.Ordinal))
                    return 1000;

                if (normalizedValue.StartsWith(normalizedQuery, StringComparison.Ordinal))
                    return 800;

                if (normalizedValue.Contains(normalizedQuery, StringComparison.Ordinal))
                    return 600;

                int distance = LevenshteinDistance(normalizedValue, normalizedQuery);
                if (distance <= 3)
                    return Math.Max(250, 400 - distance * 50);

                return 0;
            }

            int CalculateWordScore(string normalizedValue, string queryWord)
            {
                if (string.IsNullOrWhiteSpace(normalizedValue) || string.IsNullOrWhiteSpace(queryWord))
                    return 0;

                if (normalizedValue.Equals(queryWord, StringComparison.Ordinal))
                    return 140;

                if (normalizedValue.StartsWith(queryWord, StringComparison.Ordinal))
                    return 120;

                if (normalizedValue.Contains(queryWord, StringComparison.Ordinal))
                    return 100;

                foreach (var sourceWord in normalizedValue.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (sourceWord.Equals(queryWord, StringComparison.Ordinal))
                        return 140;

                    if (sourceWord.StartsWith(queryWord, StringComparison.Ordinal)
                        || queryWord.StartsWith(sourceWord, StringComparison.Ordinal))
                        return 120;

                    if (LevenshteinDistance(sourceWord, queryWord) <= 1)
                        return 80;
                }

                return 0;
            }

            int CalculateBestQueryWordScore(string? value)
            {
                if (string.IsNullOrWhiteSpace(value) || queryWords.Length == 0)
                    return 0;

                string normalizedValue = NormalizeText(value);
                return queryWords.Sum(queryWord => CalculateWordScore(normalizedValue, queryWord));
            }

            int CalculateBestLevelScore(string? value)
                => Math.Max(CalculatePhraseScore(value), CalculateBestQueryWordScore(value));

            var provinces = await _context.Provinces
                .AsNoTracking()
                .Include(p => p.Districts)
                .ThenInclude(d => d.Wards)
                .ToListAsync();

            var matches = new List<SearchMatchItem>();

            foreach (var province in provinces)
            {
                string provinceName = province.Name;
                string provinceFullName = province.FullName;
                int provincePhraseScore = Math.Max(CalculatePhraseScore(provinceName), CalculatePhraseScore(provinceFullName));
                int provinceWordScore = Math.Max(CalculateBestQueryWordScore(provinceName), CalculateBestQueryWordScore(provinceFullName));
                bool provinceMatched = provincePhraseScore > 0 || provinceWordScore > 0;

                foreach (var district in province.Districts)
                {
                    string districtName = district.Name;
                    string districtFullName = district.FullName;
                    int districtPhraseScore = Math.Max(CalculatePhraseScore(districtName), CalculatePhraseScore(districtFullName));
                    int districtWordScore = Math.Max(CalculateBestQueryWordScore(districtName), CalculateBestQueryWordScore(districtFullName));
                    bool districtMatched = districtPhraseScore > 0 || districtWordScore > 0;

                    foreach (var ward in district.Wards)
                    {
                        string wardName = ward.Name;
                        string wardFullName = ward.FullName;
                        int wardPhraseScore = Math.Max(CalculatePhraseScore(wardName), CalculatePhraseScore(wardFullName));
                        int wardWordScore = Math.Max(CalculateBestQueryWordScore(wardName), CalculateBestQueryWordScore(wardFullName));
                        bool wardMatched = wardPhraseScore > 0 || wardWordScore > 0;

                        int[] levelPhraseScores = { provincePhraseScore, districtPhraseScore, wardPhraseScore };
                        int[] levelWordScores = { provinceWordScore, districtWordScore, wardWordScore };

                        int totalQueryWordScore = queryWords.Sum(queryWord =>
                            new[]
                            {
                                CalculateWordScore(NormalizeText(provinceName), queryWord),
                                CalculateWordScore(NormalizeText(districtName), queryWord),
                                CalculateWordScore(NormalizeText(wardName), queryWord)
                            }.Max());

                        int matchedLevels = (provinceMatched ? 1 : 0) + (districtMatched ? 1 : 0) + (wardMatched ? 1 : 0);
                        int matchedWords = queryWords.Count(queryWord =>
                            new[]
                            {
                                CalculateWordScore(NormalizeText(provinceName), queryWord),
                                CalculateWordScore(NormalizeText(districtName), queryWord),
                                CalculateWordScore(NormalizeText(wardName), queryWord)
                            }.Max() > 0);

                        int levelBoost = matchedLevels > 1 ? (matchedLevels - 1) * 150 : 0;
                        int fullCoverageBonus = matchedWords == queryWords.Length ? 200 : 0;
                        int bestPhraseBonus = Math.Max(Math.Max(provincePhraseScore, districtPhraseScore), wardPhraseScore);
                        int overallScore = totalQueryWordScore + bestPhraseBonus + levelBoost + fullCoverageBonus;

                        if (overallScore > 0)
                        {
                            matches.Add(new SearchMatchItem(
                                Type: "Ward",
                                Name: ward.Name,
                                ProvinceCode: province.Code,
                                ProvinceName: province.Name,
                                DistrictCode: district.Code,
                                DistrictName: district.Name,
                                WardCode: ward.Code,
                                Score: overallScore));
                        }
                    }

                    if (!districtMatched)
                        continue;

                    int matchedLevelsForDistrict = (provinceMatched ? 1 : 0) + 1;
                    int districtMatchedWords = queryWords.Count(queryWord =>
                        Math.Max(
                            CalculateWordScore(NormalizeText(provinceName), queryWord),
                            CalculateWordScore(NormalizeText(districtName), queryWord)) > 0);

                    int districtWordCoverage = queryWords.Sum(queryWord =>
                        Math.Max(
                            CalculateWordScore(NormalizeText(provinceName), queryWord),
                            CalculateWordScore(NormalizeText(districtName), queryWord)));

                    int districtLevelBoost = matchedLevelsForDistrict > 1 ? (matchedLevelsForDistrict - 1) * 150 : 0;
                    int districtFullCoverageBonus = districtMatchedWords == queryWords.Length ? 200 : 0;
                    int districtBestPhrase = Math.Max(provincePhraseScore, districtPhraseScore);
                    int districtScore = districtWordCoverage + districtBestPhrase + districtLevelBoost + districtFullCoverageBonus;

                    matches.Add(new SearchMatchItem(
                        Type: "District",
                        Name: district.Name,
                        ProvinceCode: province.Code,
                        ProvinceName: province.Name,
                        DistrictCode: district.Code,
                        DistrictName: district.Name,
                        WardCode: null,
                        Score: districtScore));
                }

                if (provinceMatched)
                {
                    int matchedWordsForProvince = queryWords.Count(queryWord =>
                        CalculateWordScore(NormalizeText(provinceName), queryWord) > 0);

                    int provinceWordCoverage = queryWords.Sum(queryWord => CalculateWordScore(NormalizeText(provinceName), queryWord));
                    int provinceFullCoverageBonus = matchedWordsForProvince == queryWords.Length ? 200 : 0;
                    int provinceScore = provinceWordCoverage + provincePhraseScore + provinceFullCoverageBonus;

                    matches.Add(new SearchMatchItem(
                        Type: "Province",
                        Name: province.Name,
                        ProvinceCode: province.Code,
                        ProvinceName: province.Name,
                        DistrictCode: null,
                        DistrictName: null,
                        WardCode: null,
                        Score: provinceScore));
                }
            }

            var topMatches = matches
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Type == "Ward" ? 1 : x.Type == "District" ? 2 : 3)
                .ThenBy(x => x.Name, StringComparer.Ordinal)
                .Take(15)
                .ToList();

            var groupedProvinces = topMatches
                .GroupBy(x => (x.ProvinceCode, x.ProvinceName))
                .Select(provinceGroup => new ProvinceResponse
                {
                    Id = provinceGroup.Key.ProvinceCode,
                    Name = provinceGroup.Key.ProvinceName,
                    Districts = provinceGroup
                        .Where(x => x.Type == "District" || x.Type == "Ward")
                        .GroupBy(x => (x.DistrictCode, x.DistrictName))
                        .Select(districtGroup => new DistrictResponse
                        {
                            Id = districtGroup.Key.DistrictCode ?? string.Empty,
                            Name = districtGroup.Key.DistrictName ?? string.Empty,
                            Wards = districtGroup
                                .Where(x => x.Type == "Ward")
                                .GroupBy(x => (x.WardCode, x.Name))
                                .Select(wardGroup => new WardResponse
                                {
                                    Id = wardGroup.Key.WardCode!,
                                    Name = wardGroup.Key.Name
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList();

            return Ok(groupedProvinces);
        }
    }
} 